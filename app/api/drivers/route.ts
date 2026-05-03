import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsAgency, getSessionScope } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

/**
 * GET /api/drivers
 *
 * Scoped listing of drivers. Accepts optional filters:
 *  - agencyId  → restrict to a single agency (must be owned by caller)
 *  - companyId → restrict to a company (COMPANY_ADMIN of same company or SUPER_ADMIN)
 *  - status    → ACTIVE | INACTIVE
 *
 * Scoping rules (enforced after explicit filters):
 *  - SUPER_ADMIN: sees everything.
 *  - COMPANY_ADMIN: only drivers of their own company.
 *  - AGENCY_ADMIN / STATION_MANAGER: only drivers of their own agency.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['STATION_MANAGER', 'AGENCY_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'])
    const url = new URL(req.url)
    const agencyId = url.searchParams.get('agencyId')
    const companyId = url.searchParams.get('companyId')
    const status = url.searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | null

    if (agencyId) await assertOwnsAgency(session!, agencyId)

    const scope = await getSessionScope(session!)

    const where: {
      agencyId?: string | { in: string[] }
      companyId?: string
      status?: 'ACTIVE' | 'INACTIVE'
    } = {}

    if (agencyId) {
      where.agencyId = agencyId
    } else if (companyId) {
      if (scope.role !== 'SUPER_ADMIN' && scope.companyId !== companyId) {
        return bad('Accès refusé.', 403)
      }
      where.companyId = companyId
    } else if (scope.role !== 'SUPER_ADMIN') {
      if (scope.agencyId) where.agencyId = scope.agencyId
      else if (scope.companyId) where.companyId = scope.companyId
    }

    if (status === 'ACTIVE' || status === 'INACTIVE') where.status = status

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
      include: {
        agency: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ data: drivers })
  } catch (err) {
    return handleError(err)
  }
}

const createSchema = z.object({
  agencyId: z.string(),
  fullName: z.string().min(2).max(120),
  phone: z.string().max(40).optional(),
  licenseNumber: z.string().min(3).max(40),
  licenseCategory: z.enum(['B', 'C', 'D', 'D1', 'DE']).default('D'),
  licenseExpiresAt: z.string().datetime(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const body = createSchema.parse(await req.json())
    await assertOwnsAgency(session!, body.agencyId)

    const agency = await prisma.agency.findUnique({
      where: { id: body.agencyId },
      select: { companyId: true },
    })
    if (!agency) return bad('Agence introuvable.', 404)

    const driver = await prisma.driver.create({
      data: {
        agencyId: body.agencyId,
        companyId: agency.companyId,
        fullName: body.fullName,
        phone: body.phone,
        licenseNumber: body.licenseNumber,
        licenseCategory: body.licenseCategory,
        licenseExpiresAt: new Date(body.licenseExpiresAt),
      },
      include: { agency: { select: { id: true, name: true } } },
    })
    await logAudit(
      {
        action: 'driver.create',
        entityType: 'Driver',
        entityId: driver.id,
        metadata: { agencyId: body.agencyId, licenseNumber: driver.licenseNumber },
      },
      { session, req },
    )
    return NextResponse.json({ data: driver }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
