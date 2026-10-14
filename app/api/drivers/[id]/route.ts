import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsDriver } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])
    const { id } = await params
    await assertOwnsDriver(session!, id)
    const driver = await prisma.driver.findUnique({ where: { id } })
    if (!driver) return bad('Chauffeur introuvable.', 404)
    return NextResponse.json({ data: driver })
  } catch (err) {
    return handleError(err)
  }
}

const updateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(40).optional(),
  licenseNumber: z.string().min(3).max(40).optional(),
  licenseCategory: z.enum(['B', 'C', 'D', 'D1', 'DE']).optional(),
  licenseExpiresAt: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsDriver(session!, id)
    const body = updateSchema.parse(await req.json())
    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...body,
        licenseExpiresAt: body.licenseExpiresAt
          ? new Date(body.licenseExpiresAt)
          : undefined,
      },
    })
    await logAudit(
      {
        action: 'driver.update',
        entityType: 'Driver',
        entityId: id,
        metadata: { fields: Object.keys(body) },
      },
      { session, req },
    )
    return NextResponse.json({ data: driver })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsDriver(session!, id)

    // Refuse to disable a driver still assigned to a future departure.
    const futureAssignments = await prisma.departure.count({
      where: {
        driverId: id,
        departureAt: { gt: new Date() },
        tripStatus: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
    })
    if (futureAssignments > 0) {
      return bad(
        `Impossible de désactiver ce chauffeur: ${futureAssignments} départ(s) à venir lui sont assignés. Réassignez-les d'abord.`,
        409,
      )
    }

    await prisma.driver.update({ where: { id }, data: { status: 'INACTIVE' } })
    await logAudit(
      { action: 'driver.disable', entityType: 'Driver', entityId: id },
      { session, req },
    )
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
