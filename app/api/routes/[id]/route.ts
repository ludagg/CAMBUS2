import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'
import { assertOwnsRoute } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  distanceKm: z.number().int().positive().optional(),
  defaultDurationMin: z.number().int().positive().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN'])
    const { id } = await params
    await assertOwnsRoute(session!, id)
    const body = updateSchema.parse(await req.json())
    const route = await prisma.route.update({ where: { id }, data: body })
    await logAudit(
      { action: 'route.update', entityType: 'Route', entityId: id, metadata: { fields: Object.keys(body) } },
      { session, req },
    )
    return NextResponse.json({ data: route })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN'])
    const { id } = await params
    await assertOwnsRoute(session!, id)
    // Departure.route cascades: refuse when any booking ever referenced this route.
    const booked = await prisma.booking.count({ where: { departure: { routeId: id } } })
    if (booked > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${booked} réservation(s) liée(s) à cette route.` },
        { status: 409 },
      )
    }
    await prisma.route.delete({ where: { id } })
    await logAudit({ action: 'route.delete', entityType: 'Route', entityId: id }, { session, req })
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
