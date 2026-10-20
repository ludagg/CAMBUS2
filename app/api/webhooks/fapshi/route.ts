import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { confirmPayment, failPayment } from '@/lib/booking-confirm'
import { fapshiConfigured, paymentStatus, toLifecycle } from '@/lib/fapshi'

/**
 * Fapshi webhook: POST /api/webhooks/fapshi
 *
 * Configure this URL on the Fapshi dashboard (per service) and set the same
 * secret there as FAPSHI_WEBHOOK_SECRET: Fapshi echoes it in the `x-wh-secret`
 * header. The payload is the transaction object (transId, status, externalId...).
 * Fapshi sends ONE request per event and does not retry, so:
 *   - we verify the status with Fapshi (GET /payment-status) when possible, and
 *     fall back to the authenticated payload otherwise;
 *   - payments missed here are caught by polling (/api/payments/[id]) and the cron.
 */

const schema = z.object({
  transId: z.string().min(1),
  status: z.enum(['CREATED', 'PENDING', 'SUCCESSFUL', 'FAILED', 'EXPIRED']),
  externalId: z.string().optional(),
  reason: z.string().optional(),
})

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

export async function POST(req: NextRequest) {
  const secret = process.env.FAPSHI_WEBHOOK_SECRET
  if (secret) {
    const provided = req.headers.get('x-wh-secret') ?? ''
    if (!safeEqual(secret, provided)) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const { transId, externalId } = parsed.data

  // Match by transaction id; fall back to our reference (the booking group id) in
  // case the webhook beats the write of providerRef right after direct-pay.
  const payment =
    (await prisma.payment.findFirst({
      where: { providerRef: transId, method: { in: ['MOMO', 'OM'] } },
    })) ??
    (externalId
      ? await prisma.payment.findFirst({
          where: { groupId: externalId, method: { in: ['MOMO', 'OM'] } },
        })
      : null)
  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }
  if (payment.status !== 'PENDING') {
    return NextResponse.json({ data: { ok: true, idempotent: true, status: payment.status } })
  }
  if (!payment.providerRef) {
    await prisma.payment.updateMany({ where: { id: payment.id, providerRef: null }, data: { providerRef: transId } })
  }

  let status = parsed.data.status
  let reason = parsed.data.reason
  if (fapshiConfigured()) {
    try {
      const tx = await paymentStatus(transId)
      status = tx.status
      reason = tx.reason ?? reason
    } catch (err) {
      console.error('[fapshi-webhook] status verification failed, using payload', transId, err)
    }
  }

  const outcome = toLifecycle(status)
  if (outcome === 'SUCCEEDED') {
    await confirmPayment(payment.id)
  } else if (outcome === 'FAILED') {
    await failPayment(
      payment.id,
      status === 'EXPIRED' ? 'Délai de confirmation dépassé.' : reason || "Paiement refusé par l'opérateur.",
    )
  }
  return NextResponse.json({ data: { ok: true, status: outcome } })
}
