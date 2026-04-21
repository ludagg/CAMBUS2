import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { failPayment } from '@/lib/booking-confirm'

/**
 * Scheduled job: fail any PENDING payment whose BookingGroup.expiresAt has
 * passed, releasing the reserved seats. Triggered by Vercel Cron (see
 * vercel.json) every 5 minutes.
 *
 * Auth: Vercel Cron calls with `Authorization: Bearer $CRON_SECRET`. In dev,
 * any GET works.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.CRON_SECRET
    const auth = req.headers.get('authorization')
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()
  const expired = await prisma.bookingGroup.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: now },
    },
    include: { payment: true },
    take: 200,
  })

  let released = 0
  for (const group of expired) {
    if (!group.payment) continue
    try {
      await failPayment(group.payment.id, 'Délai de confirmation dépassé (cron).')
      released += 1
    } catch (err) {
      console.error('[cron] failed to release', group.id, err)
    }
  }

  return NextResponse.json({ data: { released, scanned: expired.length, at: now.toISOString() } })
}
