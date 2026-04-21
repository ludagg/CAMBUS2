import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { bad, handleError } from '@/lib/api'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { sendBookingNotifications } from '@/lib/send-booking-notifications'

const schema = z.object({
  channel: z.enum(['email', 'sms', 'both']).default('both'),
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

    // 5 resends per 10 minutes per (user, group) to avoid bill-shock on SMS.
    const rl = rateLimit(
      clientKey(req, `resend:${session!.sub}:${groupId}`),
      { limit: 5, windowSec: 600 },
    )
    if (!rl.ok) {
      return bad(
        `Trop de renvois. Réessayez dans ${rl.retryAfterSeconds}s.`,
        429,
      )
    }

    const body = schema.parse(await req.json().catch(() => ({})))

    const group = await prisma.bookingGroup.findUnique({
      where: { id: groupId },
      select: { id: true, userId: true, status: true },
    })
    if (!group) return bad('Réservation introuvable.', 404)

    if (session!.role === 'USER' && group.userId !== session!.sub) {
      return bad(
        "Vous n'êtes pas autorisé à renvoyer cette réservation.",
        403,
      )
    }
    if (group.status !== 'CONFIRMED') {
      return bad(
        'Seules les réservations confirmées peuvent être renvoyées.',
        409,
      )
    }

    const result = await sendBookingNotifications(groupId, {
      channel: body.channel,
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    return handleError(err)
  }
}
