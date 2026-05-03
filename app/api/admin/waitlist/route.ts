import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'
import { assertOwnsAgency, getSessionScope } from '@/lib/scoping'

/**
 * GET /api/admin/waitlist
 *
 * Admin view of the waitlist with passenger / departure context. Scoped to
 * the caller's company / agency unless SUPER_ADMIN, with optional explicit
 * `agencyId` / `departureId` / `status` filters.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['STATION_MANAGER', 'AGENCY_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'])
    const url = new URL(req.url)
    const agencyId = url.searchParams.get('agencyId')
    const departureId = url.searchParams.get('departureId')
    const status = url.searchParams.get('status') as
      | 'WAITING'
      | 'NOTIFIED'
      | 'PROMOTED'
      | 'EXPIRED'
      | 'CANCELLED'
      | null

    if (agencyId) await assertOwnsAgency(session!, agencyId)

    const scope = await getSessionScope(session!)

    const departureWhere: {
      agencyId?: string | { in: string[] }
    } = {}

    if (agencyId) {
      departureWhere.agencyId = agencyId
    } else if (scope.role !== 'SUPER_ADMIN') {
      if (scope.agencyId) departureWhere.agencyId = scope.agencyId
      else if (scope.companyId) {
        const agencies = await prisma.agency.findMany({
          where: { companyId: scope.companyId },
          select: { id: true },
        })
        departureWhere.agencyId = { in: agencies.map((a) => a.id) }
      }
    }

    const where: {
      departureId?: string
      status?: 'WAITING' | 'NOTIFIED' | 'PROMOTED' | 'EXPIRED' | 'CANCELLED'
      departure?: typeof departureWhere
    } = {}
    if (departureId) where.departureId = departureId
    if (status) where.status = status
    if (Object.keys(departureWhere).length > 0) where.departure = departureWhere

    const entries = await prisma.waitlistEntry.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true } },
        departure: {
          include: {
            route: {
              include: {
                originCity: { select: { name: true } },
                destinationCity: { select: { name: true } },
              },
            },
          },
        },
      },
    })
    return NextResponse.json({ data: entries })
  } catch (err) {
    return handleError(err)
  }
}
