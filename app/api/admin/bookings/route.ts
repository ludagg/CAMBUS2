import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { getSessionScope } from '@/lib/scoping'
import { handleError } from '@/lib/api'
import { dayRange, isValidDateKey } from '@/lib/datetime'

/**
 * GET /api/admin/bookings — paginated booking groups for staff.
 * Scope (same as the CSV export): SUPER all, COMPANY by route.companyId,
 * AGENCY/STATION by departure.agencyId. Fails closed (empty list) when the
 * staff account has no company / agency.
 */
const dateKey = z.string().refine(isValidDateKey, 'Date invalide.')
const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'BOARDED', 'CANCELLED']).optional(),
  from: dateKey.optional(),
  to: dateKey.optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

function decodeCursor(raw: string): { createdAt: Date; id: string } | null {
  try {
    const [iso, id] = Buffer.from(raw, 'base64url').toString('utf8').split('|')
    const createdAt = new Date(iso)
    if (!id || Number.isNaN(createdAt.getTime())) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

const encodeCursor = (createdAt: Date, id: string) =>
  Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url')

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])
    const params = Object.fromEntries(new URL(req.url).searchParams.entries())
    const q = querySchema.parse(params)

    const s = await getSessionScope(session!)
    let departureScope: Prisma.DepartureWhereInput = {}
    if (s.role === 'COMPANY_ADMIN') {
      if (!s.companyId) return NextResponse.json({ data: { items: [], nextCursor: null } })
      departureScope = { route: { companyId: s.companyId } }
    } else if (s.role !== 'SUPER_ADMIN') {
      if (!s.agencyId) return NextResponse.json({ data: { items: [], nextCursor: null } })
      departureScope = { agencyId: s.agencyId }
    }

    const and: Prisma.BookingGroupWhereInput[] = [{ bookings: { some: { departure: departureScope } } }]
    if (q.status) and.push({ status: q.status })
    if (q.from || q.to) {
      const createdAt: Prisma.DateTimeFilter = {}
      if (q.from) createdAt.gte = dayRange(q.from).start
      if (q.to) createdAt.lte = dayRange(q.to).end
      and.push({ createdAt })
    }
    if (q.q) {
      const ci = { contains: q.q, mode: 'insensitive' as const }
      and.push({
        OR: [
          { id: { endsWith: q.q, mode: 'insensitive' } },
          { contactName: ci },
          { contactPhone: ci },
          { contactEmail: ci },
          { bookings: { some: { departure: departureScope, passengers: { some: { fullName: ci } } } } },
        ],
      })
    }
    if (q.cursor) {
      const c = decodeCursor(q.cursor)
      if (!c) return NextResponse.json({ error: 'Curseur invalide.' }, { status: 400 })
      and.push({
        OR: [{ createdAt: { lt: c.createdAt } }, { createdAt: c.createdAt, id: { lt: c.id } }],
      })
    }

    const rows = await prisma.bookingGroup.findMany({
      where: { AND: and },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: q.limit + 1,
      select: {
        id: true,
        status: true,
        tripType: true,
        channel: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        payment: { select: { method: true, status: true } },
        bookings: {
          where: { departure: departureScope },
          orderBy: { leg: 'asc' },
          select: {
            id: true,
            leg: true,
            status: true,
            seats: true,
            priceCents: true,
            departure: {
              select: {
                id: true,
                departureAt: true,
                agency: { select: { name: true } },
                route: {
                  select: {
                    originCity: { select: { name: true } },
                    destinationCity: { select: { name: true } },
                  },
                },
              },
            },
            passengers: { select: { fullName: true, idNumber: true, seat: true } },
          },
        },
      },
    })

    const hasMore = rows.length > q.limit
    const page = hasMore ? rows.slice(0, q.limit) : rows
    const items = page.map((g) => ({
      id: g.id,
      reference: g.id.slice(-8).toUpperCase(),
      status: g.status,
      tripType: g.tripType,
      channel: g.channel,
      totalCents: g.bookings.reduce((sum, b) => sum + b.priceCents, 0),
      contactName: g.contactName,
      contactEmail: g.contactEmail,
      contactPhone: g.contactPhone,
      createdAt: g.createdAt,
      payment: g.payment,
      bookings: g.bookings.map((b) => ({
        id: b.id,
        leg: b.leg,
        status: b.status,
        seats: b.seats,
        departure: {
          id: b.departure.id,
          departureAt: b.departure.departureAt,
          origin: b.departure.route.originCity.name,
          destination: b.departure.route.destinationCity.name,
          agencyName: b.departure.agency.name,
        },
        passengers: b.passengers,
      })),
    }))
    const last = page[page.length - 1]
    return NextResponse.json({
      data: { items, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null },
    })
  } catch (err) {
    return handleError(err)
  }
}
