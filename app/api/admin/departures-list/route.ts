import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { getSessionScope } from '@/lib/scoping'
import { handleError } from '@/lib/api'

/**
 * Lists departures accessible to staff for counter sale, manifest, delay/cancel
 * actions. Scoped by role:
 *  - SUPER_ADMIN: all companies
 *  - COMPANY_ADMIN: their company
 *  - AGENCY_ADMIN / STATION_MANAGER: their agency
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])

    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('from') || new Date().toISOString().split('T')[0]
    const dateTo = searchParams.get('to') || dateFrom
    const start = new Date(`${dateFrom}T00:00:00`)
    const end = new Date(`${dateTo}T23:59:59`)

    const scope: {
      agencyId?: string
      route?: { companyId: string }
    } = {}

    const userScope = await getSessionScope(session!)
    if (userScope.role === 'AGENCY_ADMIN' || userScope.role === 'STATION_MANAGER') {
      if (!userScope.agencyId) return NextResponse.json({ data: [] })
      scope.agencyId = userScope.agencyId
    } else if (userScope.role === 'COMPANY_ADMIN') {
      if (!userScope.companyId) return NextResponse.json({ data: [] })
      scope.route = { companyId: userScope.companyId }
    }

    const departures = await prisma.departure.findMany({
      where: {
        ...scope,
        departureAt: { gte: start, lte: end },
        status: 'ACTIVE',
      },
      include: {
        route: {
          include: {
            company: { select: { name: true, brandColor: true } },
            originCity: { select: { name: true } },
            destinationCity: { select: { name: true } },
          },
        },
        vehicle: { select: { plate: true, capacity: true } },
        agency: { select: { name: true, id: true } },
        _count: { select: { bookings: { where: { status: { in: ['PENDING', 'CONFIRMED', 'BOARDED'] } } } } },
      },
      orderBy: { departureAt: 'asc' },
    })

    const data = departures.map((d) => ({
      id: d.id,
      agencyId: d.agencyId,
      agencyName: d.agency.name,
      company: d.route.company.name,
      brandColor: d.route.company.brandColor,
      from: d.route.originCity.name,
      to: d.route.destinationCity.name,
      departureAt: d.departureAt.toISOString(),
      arrivalAt: d.arrivalAt.toISOString(),
      priceCents: d.priceCents,
      currency: d.currency,
      seatsTotal: d.seatsTotal,
      seatsAvailable: d.seatsAvailable,
      vehiclePlate: d.vehicle?.plate ?? null,
      tripStatus: d.tripStatus,
      delayMinutes: d.delayMinutes,
      cancellationReason: d.cancellationReason,
      bookingsCount: d._count.bookings,
    }))

    return NextResponse.json({ data })
  } catch (err) {
    return handleError(err)
  }
}
