import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsAgency, assertOwnsDeparture, getSessionScope } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

/**
 * GET /api/incidents
 *
 * Scoped listing of incidents. Accepts filters:
 *  - agencyId (must match caller's scope unless SUPER_ADMIN)
 *  - departureId
 *  - unresolved=1 → only incidents without resolvedAt
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['STATION_MANAGER', 'AGENCY_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'])
    const url = new URL(req.url)
    const agencyId = url.searchParams.get('agencyId')
    const departureId = url.searchParams.get('departureId')
    const unresolvedOnly = url.searchParams.get('unresolved') === '1'

    const scope = await getSessionScope(session!)

    if (agencyId) await assertOwnsAgency(session!, agencyId)

    const where: {
      agencyId?: string | { in: string[] }
      departureId?: string
      resolvedAt?: null
    } = {}

    if (agencyId) {
      where.agencyId = agencyId
    } else if (scope.role !== 'SUPER_ADMIN') {
      if (scope.agencyId) where.agencyId = scope.agencyId
      else if (scope.companyId) {
        const agencies = await prisma.agency.findMany({
          where: { companyId: scope.companyId },
          select: { id: true },
        })
        where.agencyId = { in: agencies.map((a) => a.id) }
      }
    }
    if (departureId) where.departureId = departureId
    if (unresolvedOnly) where.resolvedAt = null

    const incidents = await prisma.incident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        reportedBy: { select: { id: true, name: true, role: true } },
        resolvedBy: { select: { id: true, name: true } },
        departure: {
          include: {
            route: { include: { originCity: true, destinationCity: true } },
          },
        },
      },
    })
    return NextResponse.json({ data: incidents })
  } catch (err) {
    return handleError(err)
  }
}

const createSchema = z.object({
  agencyId: z.string(),
  departureId: z.string().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  kind: z.enum(['BREAKDOWN', 'ACCIDENT', 'ROUTE_BLOCKED', 'WEATHER', 'SECURITY', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().min(3).max(2000),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['STATION_MANAGER', 'AGENCY_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'])
    const body = createSchema.parse(await req.json())
    await assertOwnsAgency(session!, body.agencyId)

    if (body.departureId) {
      await assertOwnsDeparture(session!, body.departureId)
      const dep = await prisma.departure.findUnique({
        where: { id: body.departureId },
        select: { agencyId: true },
      })
      if (dep && dep.agencyId !== body.agencyId) {
        return bad("Ce départ n'appartient pas à l'agence fournie.", 400)
      }
    }

    const incident = await prisma.incident.create({
      data: {
        agencyId: body.agencyId,
        departureId: body.departureId,
        vehicleId: body.vehicleId,
        driverId: body.driverId,
        kind: body.kind,
        severity: body.severity,
        description: body.description,
        reportedByUserId: session!.sub,
      },
    })
    await logAudit(
      {
        action: 'incident.create',
        entityType: 'Incident',
        entityId: incident.id,
        metadata: {
          kind: body.kind,
          severity: body.severity,
          agencyId: body.agencyId,
          departureId: body.departureId,
        },
      },
      { session, req },
    )
    return NextResponse.json({ data: incident }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
