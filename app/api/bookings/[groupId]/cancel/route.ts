import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { cancelBookingGroup, CancellationError } from '@/lib/booking-cancel'

const schema = z.object({
  reason: z.string().max(500).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const session = await getSession()
    requireRole(session, [
      'USER',
      'SUPER_ADMIN',
      'COMPANY_ADMIN',
      'AGENCY_ADMIN',
      'STATION_MANAGER',
    ])
    const { groupId } = await params

    const group = await prisma.bookingGroup.findUnique({
      where: { id: groupId },
      select: { id: true, userId: true },
    })
    if (!group) return bad('Réservation introuvable.', 404)

    // Regular users can only cancel their own bookings. Admin roles can
    // cancel on behalf of a user (counter support).
    if (session!.role === 'USER' && group.userId !== session!.sub) {
      return bad("Vous n'êtes pas autorisé à annuler cette réservation.", 403)
    }

    let reason: string | undefined
    try {
      const body = await req.json()
      reason = schema.parse(body).reason
    } catch {
      reason = undefined
    }

    await cancelBookingGroup(groupId, {
      actorUserId: session!.sub,
      reason,
    })

    return NextResponse.json({ data: { ok: true, status: 'CANCELLED' } })
  } catch (err) {
    if (err instanceof CancellationError) return bad(err.message, err.status)
    return handleError(err)
  }
}
