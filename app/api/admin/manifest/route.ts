import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'

// Station manifest: list departures from a given agency for a given date
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])

    const { searchParams } = new URL(req.url)
    const agencyId = searchParams.get('agencyId')
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
    const start = new Date(`${date}T00:00:00`)
    const end = new Date(`${date}T23:59:59`)

    const departures = await prisma.departure.findMany({
      where: {
        ...(agencyId ? { agencyId } : {}),
        departureAt: { gte: start, lte: end },
      },
      include: {
        route: {
          include: {
            originCity: { select: { name: true } },
            destinationCity: { select: { name: true } },
            company: { select: { name: true, brandColor: true } },
          },
        },
        bookings: {
          include: { passengers: true },
        },
      },
      orderBy: { departureAt: 'asc' },
    })

    const mapped = departures.map((d) => ({
      id: d.id,
      departureAt: d.departureAt.toISOString(),
      arrivalAt: d.arrivalAt.toISOString(),
      company: d.route.company.name,
      brandColor: d.route.company.brandColor,
      from: d.route.originCity.name,
      to: d.route.destinationCity.name,
      seatsTotal: d.seatsTotal,
      seatsAvailable: d.seatsAvailable,
      bookings: d.bookings.map((b) => ({
        id: b.id,
        qrCode: b.qrCode,
        leg: b.leg,
        seats: b.seats,
        status: b.status,
        passengers: b.passengers.map((p) => ({ name: p.fullName, id: p.idNumber, seat: p.seat })),
      })),
    }))

    return NextResponse.json({ data: mapped })
  } catch (err) {
    return handleError(err)
  }
}
