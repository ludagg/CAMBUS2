import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsDeparture } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  priceCents: z.number().int().positive().optional(),
  seatsTotal: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  vehicleId: z.string().nullable().optional(),
  driverId: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsDeparture(session!, id)
    const body = updateSchema.parse(await req.json())

    if (body.driverId) {
      const dep = await prisma.departure.findUnique({
        where: { id },
        select: { agencyId: true },
      })
      const driver = await prisma.driver.findUnique({
        where: { id: body.driverId },
        select: { agencyId: true, status: true },
      })
      if (!driver) return bad('Chauffeur introuvable.', 404)
      if (driver.status !== 'ACTIVE')
        return bad('Ce chauffeur est désactivé.', 409)
      if (dep && driver.agencyId !== dep.agencyId)
        return bad("Ce chauffeur n'appartient pas à l'agence du départ.", 400)
    }

    const previous = await prisma.departure.findUnique({
      where: { id },
      select: { priceCents: true, vehicleId: true, driverId: true, status: true },
    })

    const dep = await prisma.departure.update({ where: { id }, data: body })
    await logAudit(
      {
        action: 'departure.update',
        entityType: 'Departure',
        entityId: id,
        metadata: { fields: Object.keys(body), before: previous, after: body },
      },
      { session, req },
    )
    return NextResponse.json({ data: dep })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsDeparture(session!, id)
    await prisma.departure.update({ where: { id }, data: { status: 'INACTIVE' } })
    await logAudit(
      { action: 'departure.disable', entityType: 'Departure', entityId: id },
      { session, req },
    )
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
