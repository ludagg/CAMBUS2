import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsAgency } from '@/lib/scoping'
import { AlreadyBoardedError, boardBookingAndSyncGroup } from '@/lib/booking-invariants'

const schema = z.object({
  qrCode: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['STATION_MANAGER', 'AGENCY_ADMIN', 'SUPER_ADMIN'])
    const body = schema.parse(await req.json())

    const booking = await prisma.booking.findUnique({
      where: { qrCode: body.qrCode },
      include: {
        passengers: true,
        departure: {
          include: {
            originStation: { select: { name: true } },
            destStation: { select: { name: true } },
          },
        },
      },
    })

    if (!booking) return bad('Billet introuvable.', 404)
    await assertOwnsAgency(session!, booking.departure.agencyId)
    if (booking.status === 'BOARDED') return bad('Billet déjà validé.')
    if (booking.status !== 'CONFIRMED') return bad(`Statut invalide: ${booking.status}`)

    if (booking.departure.status !== 'ACTIVE' || ['CANCELLED', 'COMPLETED'].includes(booking.departure.tripStatus)) {
      return bad("Ce départ n'est plus ouvert à l'embarquement.", 409)
    }

    try {
      await boardBookingAndSyncGroup(booking.id)
    } catch (err) {
      if (err instanceof AlreadyBoardedError) return bad(err.message, 409)
      throw err
    }

    return NextResponse.json({
      data: {
        success: true,
        passenger: booking.passengers[0]?.fullName ?? 'Passager',
        seat: booking.seats[0] ?? 'N/A',
        from: booking.departure.originStation.name,
        to: booking.departure.destStation.name,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
