import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'

export async function GET() {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])

    const [companies, agencies, cities, users, bookings, departures, revenue] =
      await Promise.all([
        prisma.company.count(),
        prisma.agency.count(),
        prisma.city.count(),
        prisma.user.count(),
        prisma.bookingGroup.count(),
        prisma.departure.count(),
        prisma.payment.aggregate({ _sum: { amountCents: true }, where: { status: 'SUCCEEDED' } }),
      ])

    return NextResponse.json({
      data: {
        companies,
        agencies,
        cities,
        users,
        bookings,
        departures,
        totalRevenue: revenue._sum.amountCents ?? 0,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
