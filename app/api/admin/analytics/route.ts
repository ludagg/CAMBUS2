import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { getSessionScope } from '@/lib/scoping'
import { handleError } from '@/lib/api'

type Scope = { companyId?: string; agencyId?: string }

async function resolveScope(session: NonNullable<Awaited<ReturnType<typeof getSession>>>): Promise<Scope> {
  const s = await getSessionScope(session)
  if (s.role === 'SUPER_ADMIN') return {}
  if (s.role === 'COMPANY_ADMIN') return { companyId: s.companyId ?? '__none__' }
  return { agencyId: s.agencyId ?? '__none__' }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])

    const { searchParams } = new URL(req.url)
    const rangeDays = Math.min(365, Math.max(1, Number(searchParams.get('rangeDays') || 30)))
    const now = new Date()
    const from = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000)

    const scope = await resolveScope(session!)

    const departureScope: Prisma.DepartureWhereInput = {
      ...(scope.agencyId ? { agencyId: scope.agencyId } : {}),
      ...(scope.companyId ? { route: { companyId: scope.companyId } } : {}),
    }

    const groupScope: Prisma.BookingGroupWhereInput = {
      status: 'CONFIRMED',
      createdAt: { gte: from },
      bookings: { some: { departure: departureScope } },
    }

    // Revenue + counts over range
    const groups = await prisma.bookingGroup.findMany({
      where: groupScope,
      select: {
        id: true,
        totalCents: true,
        channel: true,
        createdAt: true,
        bookings: {
          select: {
            seats: true,
            departureId: true,
            departure: {
              select: {
                route: {
                  select: {
                    originCity: { select: { name: true } },
                    destinationCity: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Daily time series (YYYY-MM-DD → { revenue, bookings })
    const daily = new Map<string, { revenue: number; bookings: number }>()
    for (let i = 0; i < rangeDays; i++) {
      const d = new Date(from)
      d.setDate(d.getDate() + i)
      daily.set(d.toISOString().split('T')[0], { revenue: 0, bookings: 0 })
    }
    let totalRevenue = 0
    let totalBookings = 0
    let counterRevenue = 0
    let onlineRevenue = 0
    for (const g of groups) {
      const key = g.createdAt.toISOString().split('T')[0]
      const row = daily.get(key) ?? { revenue: 0, bookings: 0 }
      row.revenue += g.totalCents
      row.bookings += 1
      daily.set(key, row)
      totalRevenue += g.totalCents
      totalBookings += 1
      if (g.channel === 'COUNTER') counterRevenue += g.totalCents
      else onlineRevenue += g.totalCents
    }

    // Top routes
    const routeAgg = new Map<string, { from: string; to: string; revenue: number; bookings: number }>()
    for (const g of groups) {
      for (const b of g.bookings) {
        const rk = `${b.departure.route.originCity.name}→${b.departure.route.destinationCity.name}`
        const row =
          routeAgg.get(rk) ??
          {
            from: b.departure.route.originCity.name,
            to: b.departure.route.destinationCity.name,
            revenue: 0,
            bookings: 0,
          }
        row.bookings += 1
        routeAgg.set(rk, row)
      }
    }
    const topRoutes = Array.from(routeAgg.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10)

    // Seat heatmap (count of each seat in scope)
    const heatmap = new Map<string, number>()
    for (const g of groups) {
      for (const b of g.bookings) {
        for (const seat of b.seats) {
          heatmap.set(seat, (heatmap.get(seat) ?? 0) + 1)
        }
      }
    }
    const seatHeatmap = Array.from(heatmap.entries())
      .map(([seat, count]) => ({ seat, count }))
      .sort((a, b) => b.count - a.count)

    // Occupancy by departure (past + upcoming within range)
    const departures = await prisma.departure.findMany({
      where: {
        ...departureScope,
        departureAt: { gte: from, lte: new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        departureAt: true,
        seatsTotal: true,
        seatsAvailable: true,
        tripStatus: true,
        route: {
          select: {
            originCity: { select: { name: true } },
            destinationCity: { select: { name: true } },
          },
        },
      },
      orderBy: { departureAt: 'desc' },
      take: 200,
    })
    const occupancy = departures.map((d) => ({
      id: d.id,
      departureAt: d.departureAt.toISOString(),
      from: d.route.originCity.name,
      to: d.route.destinationCity.name,
      seatsTotal: d.seatsTotal,
      seatsBooked: d.seatsTotal - d.seatsAvailable,
      occupancyPct: d.seatsTotal > 0 ? Math.round(((d.seatsTotal - d.seatsAvailable) / d.seatsTotal) * 100) : 0,
      tripStatus: d.tripStatus,
    }))

    const avgOccupancyPct =
      occupancy.length > 0
        ? Math.round(occupancy.reduce((s, o) => s + o.occupancyPct, 0) / occupancy.length)
        : 0

    return NextResponse.json({
      data: {
        rangeDays,
        totals: {
          revenueCents: totalRevenue,
          bookings: totalBookings,
          counterRevenueCents: counterRevenue,
          onlineRevenueCents: onlineRevenue,
          avgOccupancyPct,
        },
        daily: Array.from(daily.entries()).map(([date, v]) => ({ date, ...v })),
        topRoutes,
        seatHeatmap,
        occupancy,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
