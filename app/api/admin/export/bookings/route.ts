import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { getSessionScope } from '@/lib/scoping'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])

  const { searchParams } = new URL(req.url)
  const rangeDays = Math.min(365, Math.max(1, Number(searchParams.get('rangeDays') || 30)))
  const from = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000)

  const s = await getSessionScope(session!)
  const departureScope: Prisma.DepartureWhereInput =
    s.role === 'SUPER_ADMIN'
      ? {}
      : s.role === 'COMPANY_ADMIN'
        ? { route: { companyId: s.companyId ?? '__none__' } }
        : { agencyId: s.agencyId ?? '__none__' }

  const groups = await prisma.bookingGroup.findMany({
    where: {
      createdAt: { gte: from },
      bookings: { some: { departure: departureScope } },
    },
    include: {
      bookings: {
        include: {
          departure: {
            include: {
              route: {
                include: {
                  originCity: { select: { name: true } },
                  destinationCity: { select: { name: true } },
                  company: { select: { name: true } },
                },
              },
            },
          },
          passengers: true,
        },
      },
      payment: true,
      soldBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const header = [
    'booking_group_id',
    'created_at',
    'status',
    'channel',
    'sold_by',
    'payment_method',
    'payment_status',
    'total_cents',
    'currency',
    'contact_name',
    'contact_email',
    'contact_phone',
    'company',
    'from',
    'to',
    'departure_at',
    'leg',
    'seats',
    'passengers',
  ]
  const lines: string[] = [header.join(',')]
  for (const g of groups) {
    for (const b of g.bookings) {
      lines.push(
        [
          g.id,
          g.createdAt.toISOString(),
          g.status,
          g.channel ?? '',
          g.soldBy?.name ?? '',
          g.payment?.method ?? '',
          g.payment?.status ?? '',
          g.totalCents,
          g.currency,
          g.contactName ?? '',
          g.contactEmail,
          g.contactPhone,
          b.departure.route.company.name,
          b.departure.route.originCity.name,
          b.departure.route.destinationCity.name,
          b.departure.departureAt.toISOString(),
          b.leg,
          b.seats.join('|'),
          b.passengers.map((p) => `${p.fullName}${p.idNumber ? ` (${p.idNumber})` : ''}`).join('|'),
        ]
          .map(csvEscape)
          .join(','),
      )
    }
  }

  const body = lines.join('\n')
  const filename = `easytravel-bookings-${new Date().toISOString().split('T')[0]}.csv`
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
