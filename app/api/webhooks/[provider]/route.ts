import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { confirmPayment, failPayment } from '@/lib/booking-confirm'

/**
 * Mobile Money webhook receiver. Both Orange Money and MTN MoMo POST here
 * when a user confirms (or rejects) a USSD prompt.
 *
 * POST /api/webhooks/om
 * POST /api/webhooks/momo
 *
 * Authentication: HMAC-SHA256 signature over the raw body using the shared
 * secret (OM_WEBHOOK_SECRET / MOMO_WEBHOOK_SECRET). In development, if no
 * secret is configured we accept unsigned calls — enabling local testing.
 *
 * Idempotent: we key on (providerRef, status). Re-posting the same event is a
 * no-op.
 *
 * Expected body shape (simplified, matches the simulated provider + a
 * reasonable subset of real OM/MoMo payloads):
 *   {
 *     "externalRef": "SIM-OM-cla1...",
 *     "status": "SUCCEEDED" | "FAILED",
 *     "reason"?: "Solde insuffisant"
 *   }
 */

const schema = z.object({
  externalRef: z.string().min(1),
  status: z.enum(['SUCCEEDED', 'FAILED']),
  reason: z.string().optional(),
})

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params
  if (provider !== 'om' && provider !== 'momo') {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 404 })
  }

  const secretEnv = provider === 'om' ? 'OM_WEBHOOK_SECRET' : 'MOMO_WEBHOOK_SECRET'
  const secret = process.env[secretEnv]
  const signatureHeader = req.headers.get('x-signature') || req.headers.get('x-hub-signature-256')

  const raw = await req.text()

  if (secret) {
    if (!signatureHeader) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
    const provided = signatureHeader.replace(/^sha256=/, '').trim()
    if (!timingSafeEqual(expected, provided)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 })
  }

  const payment = await prisma.payment.findFirst({
    where: { providerRef: parsed.data.externalRef },
  })
  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (payment.status === 'SUCCEEDED' || payment.status === 'FAILED' || payment.status === 'REFUNDED') {
    return NextResponse.json({ data: { ok: true, idempotent: true, status: payment.status } })
  }

  if (parsed.data.status === 'SUCCEEDED') {
    await confirmPayment(payment.id)
  } else {
    await failPayment(payment.id, parsed.data.reason ?? 'Paiement refusé par l\'opérateur.')
  }

  return NextResponse.json({ data: { ok: true, status: parsed.data.status } })
}
