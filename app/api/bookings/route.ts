import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'

export async function GET() {
  try {
    const session = await getSession()
    requireRole(session, ['USER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])

    const groups = await prisma.bookingGroup.findMany({
      where: { userId: session!.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        bookings: {
          include: {
            departure: {
              include: {
                route: {
                  include: {
                    company: { select: { name: true, logo: true, brandColor: true } },
                    originCity: { select: { name: true } },
                    destinationCity: { select: { name: true } },
                  },
                },
                originStation: { select: { name: true } },
                destStation: { select: { name: true } },
              },
            },
            passengers: true,
          },
        },
        payment: true,
      },
    })

    const mapped = groups.map((g) => ({
      id: g.id,
      tripType: g.tripType,
      totalPrice: g.totalCents,
      currency: g.currency,
      status: g.status,
      contactEmail: g.contactEmail,
      contactPhone: g.contactPhone,
      createdAt: g.createdAt.toISOString(),
      bookings: g.bookings.map((b) => ({
        id: b.id,
        leg: b.leg,
        seats: b.seats,
        price: b.priceCents,
        status: b.status,
        qrCode: b.qrCode,
        agencyName: b.departure.route.company.name,
        agencyLogo: b.departure.route.company.logo,
        color: b.departure.route.company.brandColor,
        from: b.departure.originStation.name,
        to: b.departure.destStation.name,
        fromCity: b.departure.route.originCity.name,
        toCity: b.departure.route.destinationCity.name,
        departureTime: b.departure.departureAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        arrivalTime: b.departure.arrivalAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        date: b.departure.departureAt.toISOString().split('T')[0],
        passengers: b.passengers,
      })),
      payment: g.payment ? { method: g.payment.method, status: g.payment.status } : null,
    }))

    return NextResponse.json({ data: mapped })
  } catch (err) {
    return handleError(err)
  }
}

const passengerSchema = z.object({
  fullName: z.string().min(1),
  idNumber: z.string().optional(),
  seat: z.string().optional(),
})

const bookingSchema = z.object({
  outboundDepartureId: z.string(),
  returnDepartureId: z.string().optional(),
  passengers: z.array(passengerSchema).min(1),
  outboundSeats: z.array(z.string()).optional(),
  returnSeats: z.array(z.string()).optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  paymentMethod: z.enum(['MOMO', 'OM', 'CARD', 'CASH']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['USER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])
    const body = bookingSchema.parse(await req.json())

    const outDep = await prisma.departure.findUnique({ where: { id: body.outboundDepartureId } })
    if (!outDep) return bad('Départ aller introuvable.', 404)
    if (outDep.seatsAvailable < body.passengers.length) return bad('Places insuffisantes pour l\'aller.')

    let retDep = null
    if (body.returnDepartureId) {
      retDep = await prisma.departure.findUnique({ where: { id: body.returnDepartureId } })
      if (!retDep) return bad('Départ retour introuvable.', 404)
      if (retDep.seatsAvailable < body.passengers.length) return bad('Places insuffisantes pour le retour.')
    }

    const outPrice = outDep.priceCents * body.passengers.length
    const retPrice = retDep ? retDep.priceCents * body.passengers.length : 0
    const totalCents = outPrice + retPrice

    const result = await prisma.$transaction(async (tx) => {
      // Decrement seats
      await tx.departure.update({
        where: { id: outDep.id },
        data: { seatsAvailable: { decrement: body.passengers.length } },
      })
      if (retDep) {
        await tx.departure.update({
          where: { id: retDep.id },
          data: { seatsAvailable: { decrement: body.passengers.length } },
        })
      }

      const group = await tx.bookingGroup.create({
        data: {
          userId: session!.sub,
          tripType: retDep ? 'ROUND_TRIP' : 'ONE_WAY',
          contactEmail: body.contactEmail,
          contactPhone: body.contactPhone,
          totalCents,
          currency: outDep.currency,
          status: 'CONFIRMED',
        },
      })

      const outBooking = await tx.booking.create({
        data: {
          groupId: group.id,
          departureId: outDep.id,
          leg: 'OUTBOUND',
          seats: body.outboundSeats ?? [],
          priceCents: outPrice,
          status: 'CONFIRMED',
        },
      })

      for (const p of body.passengers) {
        await tx.passenger.create({
          data: {
            bookingId: outBooking.id,
            fullName: p.fullName,
            idNumber: p.idNumber,
            seat: p.seat,
          },
        })
      }

      if (retDep) {
        const retBooking = await tx.booking.create({
          data: {
            groupId: group.id,
            departureId: retDep.id,
            leg: 'RETURN',
            seats: body.returnSeats ?? [],
            priceCents: retPrice,
            status: 'CONFIRMED',
          },
        })
        for (const p of body.passengers) {
          await tx.passenger.create({
            data: {
              bookingId: retBooking.id,
              fullName: p.fullName,
              idNumber: p.idNumber,
              seat: p.seat,
            },
          })
        }
      }

      await tx.payment.create({
        data: {
          groupId: group.id,
          method: body.paymentMethod,
          amountCents: totalCents,
          currency: outDep.currency,
          status: 'SUCCEEDED',
          providerRef: `SIM-${Date.now()}`,
        },
      })

      return group
    })

    return NextResponse.json({ data: { groupId: result.id } }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
