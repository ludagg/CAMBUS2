import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { assertOwnsDeparture } from '@/lib/scoping'
import { handleError, bad } from '@/lib/api'
import { cancelBookingGroup } from '@/lib/booking-cancel'
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

    // Cancelling a trip is a company decision; station staff may only delay.
    if (body.action === 'CANCEL' && session!.role === 'STATION_MANAGER') {
      return bad('Action réservée aux administrateurs.', 403)
    }
    if (dep.tripStatus === 'CANCELLED' || dep.tripStatus === 'COMPLETED') {
      return bad(`Ce départ est déjà ${dep.tripStatus === 'CANCELLED' ? 'annulé' : 'terminé'}.`, 409)
    }

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
      const cancelReason = body.reason ?? 'Départ annulé par la compagnie.'
      await prisma.departure.update({
        where: { id },
        data: { tripStatus: 'CANCELLED', cancellationReason: cancelReason },
      })
      // Notify while the bookings are still active, then cancel + refund each group.
      await notifyDepartureChange(id, 'CANCELLED', { reason: body.reason })
      const groups = await prisma.booking.findMany({
        where: { departureId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
        select: { groupId: true },
        distinct: ['groupId'],
      })
      let failed = 0
      for (const g of groups) {
        try {
          await cancelBookingGroup(g.groupId, {
            actorUserId: session!.sub,
            reason: cancelReason,
            companyInitiated: true,
          })
        } catch (err) {
          failed++
          console.error('[departure-cancel] group cancel failed', g.groupId, err)
        }
      }
      await logAudit(
        {
          action: 'departure.cancel',
          entityType: 'Departure',
          entityId: id,
          metadata: { reason: body.reason, groups: groups.length, failedGroups: failed },
        },
        { session, req },
      )
      return NextResponse.json({ data: { ok: true, notified: true, cancelledGroups: groups.length - failed, failedGroups: failed } })
    }

    if (body.action === 'RESET') {
      if (dep.tripStatus !== 'DELAYED') return bad('Seul un départ retardé peut être réinitialisé.', 409)
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
