import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError } from '@/lib/api'
import { defaultLayoutForCapacity, type SeatLayout } from '@/lib/seat-layout'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const departure = await prisma.departure.findUnique({
      where: { id },
      include: {
        vehicle: true,
        bookings: {
          where: { status: { in: ['PENDING', 'CONFIRMED', 'BOARDED'] } },
          select: { seats: true },
        },
      },
    })
    if (!departure) return NextResponse.json({ error: 'Départ introuvable.' }, { status: 404 })

    const capacity = departure.vehicle?.capacity ?? departure.seatsTotal
    const storedLayout = (departure.vehicle?.seatLayout ?? null) as SeatLayout | null
    const layout: SeatLayout = storedLayout ?? defaultLayoutForCapacity(capacity)

    const bookedSeats = Array.from(new Set(departure.bookings.flatMap((b) => b.seats)))

    return NextResponse.json({
      data: {
        departureId: departure.id,
        basePriceCents: departure.priceCents,
        currency: departure.currency,
        capacity,
        layout,
        bookedSeats,
        seatsAvailable: departure.seatsAvailable,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
