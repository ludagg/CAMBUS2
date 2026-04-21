import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { assertOwnsDeparture } from '@/lib/scoping'
import { handleError, bad } from '@/lib/api'
import { notifyDepartureChange } from '@/lib/departure-notifications'
import { logAudit } from '@/lib/audit'

const schema = z.object({
  action: z.enum(['DELAY', 'CANCEL', 'RESCHEDULE', 'RESET']),
  delayMinutes: z.number().int().min(0).max(24 * 60).optional(),
  reason: z.string().max(500).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])
    const { id } = await params
    await assertOwnsDeparture(session!, id)

    const body = schema.parse(await req.json())

    const dep = await prisma.departure.findUnique({ where: { id } })
    if (!dep) return bad('Départ introuvable.', 404)

    if (body.action === 'DELAY') {
      const delay = body.delayMinutes ?? 0
      if (delay <= 0) return bad('delayMinutes doit être > 0 pour un retard.')
      await prisma.departure.update({
        where: { id },
        data: {
          tripStatus: 'DELAYED',
          delayMinutes: delay,
          cancellationReason: null,
        },
      })
      await notifyDepartureChange(id, 'DELAYED', { delayMinutes: delay, reason: body.reason })
      await logAudit(
        {
          action: 'departure.delay',
          entityType: 'Departure',
          entityId: id,
          metadata: { delayMinutes: delay, reason: body.reason },
        },
        { session, req },
      )
      return NextResponse.json({ data: { ok: true, notified: true } })
    }

    if (body.action === 'CANCEL') {
      await prisma.$transaction(async (tx) => {
        await tx.departure.update({
          where: { id },
          data: {
            tripStatus: 'CANCELLED',
            cancellationReason: body.reason ?? 'Départ annulé par la compagnie.',
          },
        })
        await tx.booking.updateMany({
          where: { departureId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
          data: { status: 'CANCELLED' },
        })
      })
      await notifyDepartureChange(id, 'CANCELLED', { reason: body.reason })
      await logAudit(
        {
          action: 'departure.cancel',
          entityType: 'Departure',
          entityId: id,
          metadata: { reason: body.reason },
        },
        { session, req },
      )
      return NextResponse.json({ data: { ok: true, notified: true } })
    }

    if (body.action === 'RESET') {
      await prisma.departure.update({
        where: { id },
        data: {
          tripStatus: 'SCHEDULED',
          delayMinutes: null,
          cancellationReason: null,
          passengersNotifiedAt: null,
        },
      })
      await logAudit(
        { action: 'departure.reset', entityType: 'Departure', entityId: id },
        { session, req },
      )
      return NextResponse.json({ data: { ok: true } })
    }

    return bad('Action non supportée.', 400)
  } catch (err) {
    return handleError(err)
  }
}
