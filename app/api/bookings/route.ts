import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { localDateKey } from '@/lib/datetime'
import { logAudit } from '@/lib/audit'
import { markWaitlistPromoted } from '@/lib/waitlist'
import { getProvider, normalizeCameroonPhone, PaymentUnavailableError, type PaymentProviderId } from '@/lib/payment'
import { failPayment } from '@/lib/booking-confirm'
import { MIN_AMOUNT_XAF, fapshiConfigured } from '@/lib/fapshi'
import {
  computeSeatPriceCents,
  defaultLayoutForCapacity,
  DEFAULT_VIP_MULTIPLIER,
  allSeatIds,
  type SeatLayout,
} from '@/lib/seat-layout'

const PENDING_EXPIRY_MIN = 10

class SoldOutError extends Error {
  constructor(public leg: string) {
    super('sold out')
  }
}

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
        departureTime: b.departure.departureAt.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit', hour12: false }),
        arrivalTime: b.departure.arrivalAt.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit', hour12: false }),
        date: localDateKey(b.departure.departureAt),
        passengers: b.passengers,
      })),
      payment: g.payment ? { method: g.payment.method, status: g.payment.status, provider: g.payment.provider, phoneNumber: g.payment.phoneNumber } : null,
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
  contactName: z.string().optional(),
  paymentMethod: z.enum(['MOMO', 'OM', 'CARD', 'CASH']),
  paymentPhone: z.string().optional(),
})

function isBookable(dep: { status: string; tripStatus: string; departureAt: Date }): boolean {
  return (
    dep.status === 'ACTIVE' &&
    (dep.tripStatus === 'SCHEDULED' || dep.tripStatus === 'DELAYED') &&
    dep.departureAt.getTime() > Date.now()
  )
}

function resolveLayout(seatLayout: Prisma.JsonValue | null, capacity: number): SeatLayout {
  if (seatLayout && typeof seatLayout === 'object' && !Array.isArray(seatLayout)) {
    const obj = seatLayout as Record<string, unknown>
    return {
      rows: Number(obj.rows ?? 0),
      cols: Number(obj.cols ?? 0),
      aisleAfterCol: Number(obj.aisleAfterCol ?? 0),
      vipRows: Array.isArray(obj.vipRows) ? (obj.vipRows as number[]) : [],
      disabledCells: Array.isArray(obj.disabledCells) ? (obj.disabledCells as string[]) : [],
      label: String(obj.label ?? ''),
      vipMultiplier: Number(obj.vipMultiplier ?? DEFAULT_VIP_MULTIPLIER),
    }
  }
  return defaultLayoutForCapacity(capacity)
}

function sumSeats(
  baseCents: number,
  layout: SeatLayout,
  seats: string[],
  passengerCount: number,
): number {
  if (seats.length === 0) return baseCents * passengerCount
  // Price per selected seat; if fewer selected than passengers, remaining pay base.
  let total = 0
  for (const s of seats) total += computeSeatPriceCents(baseCents, layout, s)
  const remaining = Math.max(0, passengerCount - seats.length)
  total += remaining * baseCents
  return total
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['USER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])
    const body = bookingSchema.parse(await req.json())

    if (body.paymentMethod === 'CASH' && session!.role === 'USER') {
      return bad('Le paiement en espèces est uniquement disponible au guichet.', 403)
    }

    // No real card provider is wired in: a "CARD" payment is simulated and
    // would confirm the booking for free. Only allow it outside production
    // (or when explicitly opted in).
    if (
      body.paymentMethod === 'CARD' &&
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_SIMULATED_CARD !== 'true'
    ) {
      return bad("Le paiement par carte n'est pas encore disponible.", 400)
    }

    const idempotencyKey = req.headers.get('idempotency-key')?.trim() || null
    if (idempotencyKey) {
      const existing = await prisma.bookingGroup.findUnique({
        where: { idempotencyKey },
        include: { payment: true },
      })
      if (existing) {
        if (existing.userId !== session!.sub && existing.soldByUserId !== session!.sub) {
          return bad("Clé d'idempotence déjà utilisée.", 409)
        }
        return NextResponse.json(
          {
            data: {
              groupId: existing.id,
              paymentId: existing.payment?.id ?? null,
              status: existing.payment?.status ?? existing.status,
              requiresConfirmation: existing.payment?.status === 'PENDING',
              idempotent: true,
            },
          },
          { status: 200 },
        )
      }
    }

    const isMobileMoney = body.paymentMethod === 'MOMO' || body.paymentMethod === 'OM'
    let normalizedPhone: string | null = null
    if (isMobileMoney) {
      const rawPhone = body.paymentPhone || body.contactPhone
      normalizedPhone = normalizeCameroonPhone(rawPhone)
      if (!normalizedPhone) {
        return bad('Numéro Mobile Money invalide. Format attendu: 6XX XXX XXX.')
      }
      // Fail early (before holding seats) when no payment gateway can process this.
      try {
        getProvider(body.paymentMethod as PaymentProviderId)
      } catch (err) {
        if (err instanceof PaymentUnavailableError) return bad(err.message, 503)
        throw err
      }
    }

    const outDep = await prisma.departure.findUnique({
      where: { id: body.outboundDepartureId },
      include: { vehicle: { select: { seatLayout: true, capacity: true } } },
    })
    if (!outDep) return bad('Départ aller introuvable.', 404)
    if (!isBookable(outDep)) return bad("Ce départ aller n'est plus disponible à la réservation.", 409)
    if (outDep.seatsAvailable < body.passengers.length) return bad('Places insuffisantes pour l\'aller.')

    let retDep: Awaited<ReturnType<typeof prisma.departure.findUnique>> | null = null
    if (body.returnDepartureId) {
      retDep = await prisma.departure.findUnique({
        where: { id: body.returnDepartureId },
        include: { vehicle: { select: { seatLayout: true, capacity: true } } },
      })
      if (!retDep) return bad('Départ retour introuvable.', 404)
      if (!isBookable(retDep)) return bad("Ce départ retour n'est plus disponible à la réservation.", 409)
      if (retDep.seatsAvailable < body.passengers.length) return bad('Places insuffisantes pour le retour.')
    }

    const outSeats = body.outboundSeats ?? []
    const retSeats = body.returnSeats ?? []
    if (outSeats.length > 0 && new Set(outSeats).size !== outSeats.length) {
      return bad('Sièges aller en doublon.')
    }
    if (retSeats.length > 0 && new Set(retSeats).size !== retSeats.length) {
      return bad('Sièges retour en doublon.')
    }

    const outLayout = resolveLayout(
      (outDep as unknown as { vehicle: { seatLayout: Prisma.JsonValue | null; capacity: number } | null }).vehicle?.seatLayout ?? null,
      (outDep as unknown as { vehicle: { capacity: number } | null }).vehicle?.capacity ?? 50,
    )
    const retLayout = retDep
      ? resolveLayout(
          (retDep as unknown as { vehicle: { seatLayout: Prisma.JsonValue | null; capacity: number } | null }).vehicle?.seatLayout ?? null,
          (retDep as unknown as { vehicle: { capacity: number } | null }).vehicle?.capacity ?? 50,
        )
      : null

    if (outSeats.length > body.passengers.length || retSeats.length > body.passengers.length) {
      return bad('Plus de sièges sélectionnés que de passagers.')
    }
    const outValid = new Set(allSeatIds(outLayout))
    if (outSeats.some((x) => !outValid.has(x))) return bad('Siège aller invalide.')
    if (retLayout) {
      const retValid = new Set(allSeatIds(retLayout))
      if (retSeats.some((x) => !retValid.has(x))) return bad('Siège retour invalide.')
    } else if (retSeats.length > 0) {
      return bad('Sièges retour sans départ retour.')
    }

    const outPrice = sumSeats(outDep.priceCents, outLayout, outSeats, body.passengers.length)
    const retPrice = retDep && retLayout
      ? sumSeats(retDep.priceCents, retLayout, retSeats, body.passengers.length)
      : 0
    const totalCents = outPrice + retPrice
    if (isMobileMoney && fapshiConfigured() && totalCents < MIN_AMOUNT_XAF) {
      return bad(`Montant minimum pour Mobile Money: ${MIN_AMOUNT_XAF} FCFA.`)
    }

    const initialStatus = isMobileMoney ? 'PENDING' : 'CONFIRMED'
    const expiresAt = isMobileMoney
      ? new Date(Date.now() + PENDING_EXPIRY_MIN * 60 * 1000)
      : null

    let result: { groupId: string; paymentId: string; paymentStatus: string }
    try {
      result = await prisma.$transaction(async (tx) => {
        const n = body.passengers.length
        const outUpd = await tx.departure.updateMany({
          where: { id: outDep.id, seatsAvailable: { gte: n } },
          data: { seatsAvailable: { decrement: n } },
        })
        if (outUpd.count === 0) throw new SoldOutError('aller')
        if (retDep) {
          const retUpd = await tx.departure.updateMany({
            where: { id: retDep.id, seatsAvailable: { gte: n } },
            data: { seatsAvailable: { decrement: n } },
          })
          if (retUpd.count === 0) throw new SoldOutError('retour')
        }

        const isStaff = session!.role !== 'USER'
        const isCounterSale = isStaff && body.paymentMethod === 'CASH'
        const group = await tx.bookingGroup.create({
          data: {
            userId: isCounterSale ? null : session!.sub,
            tripType: retDep ? 'ROUND_TRIP' : 'ONE_WAY',
            contactEmail: body.contactEmail,
            contactPhone: body.contactPhone,
            contactName: body.contactName,
            totalCents,
            currency: outDep.currency,
            status: initialStatus,
            idempotencyKey,
            expiresAt,
            soldByUserId: isStaff ? session!.sub : null,
            channel: isCounterSale ? 'COUNTER' : 'ONLINE',
          },
        })

        const outBooking = await tx.booking.create({
          data: {
            groupId: group.id,
            departureId: outDep.id,
            leg: 'OUTBOUND',
            seats: outSeats,
            priceCents: outPrice,
            status: initialStatus,
          },
        })

        for (const s of outSeats) {
          await tx.bookingSeat.create({
            data: { departureId: outDep.id, seatId: s, bookingId: outBooking.id },
          })
        }

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
              seats: retSeats,
              priceCents: retPrice,
              status: initialStatus,
            },
          })
          for (const s of retSeats) {
            await tx.bookingSeat.create({
              data: { departureId: retDep.id, seatId: s, bookingId: retBooking.id },
            })
          }
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

        const payment = await tx.payment.create({
          data: {
            groupId: group.id,
            method: body.paymentMethod,
            provider: isMobileMoney ? getProvider(body.paymentMethod as PaymentProviderId).name : null,
            phoneNumber: normalizedPhone,
            amountCents: totalCents,
            currency: outDep.currency,
            status: isMobileMoney ? 'PENDING' : 'SUCCEEDED',
            providerRef: isMobileMoney ? null : `SIM-${body.paymentMethod}-${Date.now()}`,
          },
        })

        return { groupId: group.id, paymentId: payment.id, paymentStatus: payment.status }
      })
    } catch (err) {
      if (err instanceof SoldOutError) return bad(`Places insuffisantes pour le ${err.leg}.`, 409)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined) ?? []
        if (target.includes('idempotencyKey')) {
          const existing = await prisma.bookingGroup.findUnique({
            where: { idempotencyKey: idempotencyKey! },
            include: { payment: true },
          })
          if (existing && (existing.userId === session!.sub || existing.soldByUserId === session!.sub)) {
            return NextResponse.json(
              {
                data: {
                  groupId: existing.id,
                  paymentId: existing.payment?.id ?? null,
                  status: existing.payment?.status ?? existing.status,
                  requiresConfirmation: existing.payment?.status === 'PENDING',
                  idempotent: true,
                },
              },
              { status: 200 },
            )
          }
        }
        return bad('Un des sièges sélectionnés vient d\'être réservé par un autre passager. Veuillez réessayer.', 409)
      }
      throw err
    }

    if (isMobileMoney && normalizedPhone) {
      const provider = getProvider(body.paymentMethod as PaymentProviderId)
      try {
        const init = await provider.initiate({
          amountCents: totalCents,
          currency: outDep.currency,
          phoneNumber: normalizedPhone,
          reference: result.groupId,
        })
        await prisma.payment.update({
          where: { id: result.paymentId },
          data: { providerRef: init.externalRef },
        })
      } catch (err) {
        // The prompt never reached the customer: release the seats right away.
        console.error('[payment] initiate failed', result.groupId, err)
        await failPayment(result.paymentId, "Le paiement n'a pas pu être initié auprès de l'opérateur.").catch(
          (e) => console.error('[payment] release after initiate failure failed', e),
        )
        const message =
          err instanceof Error && 'status' in err && (err as { status: number }).status === 400
            ? err.message
            : "Impossible de lancer le paiement Mobile Money. Réessayez dans un instant."
        return bad(message, 502)
      }
    }

    // A booking by someone who was offered a freed seat closes their waitlist entry.
    for (const depId of [outDep.id, retDep?.id]) {
      if (!depId) continue
      await markWaitlistPromoted(
        depId,
        { userId: session!.role === 'USER' ? session!.sub : null, email: body.contactEmail },
        result.groupId,
      ).catch((err) => console.error('[waitlist] mark promoted failed', err))
    }

    if (session!.role !== 'USER') {
      await logAudit(
        {
          action: body.paymentMethod === 'CASH' ? 'booking.counter_sale' : 'booking.staff_create',
          entityType: 'BookingGroup',
          entityId: result.groupId,
          metadata: { totalCents, paymentMethod: body.paymentMethod, departureId: outDep.id, passengers: body.passengers.length },
        },
        { session, req },
      )
    }

    return NextResponse.json(
      {
        data: {
          groupId: result.groupId,
          paymentId: result.paymentId,
          status: result.paymentStatus,
          requiresConfirmation: isMobileMoney,
        },
      },
      { status: 201 },
    )
  } catch (err) {
    return handleError(err)
  }
}
