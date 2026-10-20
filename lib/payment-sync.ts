import { prisma } from './prisma'
import { getProvider, type PaymentProviderId } from './payment'
import { confirmPayment, failPayment } from './booking-confirm'
import { fapshiConfigured } from './fapshi'

// Fapshi allows 6 status checks per minute per transaction: stay well under it.
const MIN_GAP_MS = 12_000
const lastCheck = new Map<string, number>()

/**
 * Ask the payment gateway for the real state of a PENDING mobile money payment
 * and apply it (confirm / fail). Returns the resulting payment status.
 *
 * `gatewayOnly`: only consult a real gateway (never the demo simulator). Used
 * before expiring a payment, so money captured late is not thrown away.
 */
export async function syncPendingPayment(
  paymentId: string,
  opts: { gatewayOnly?: boolean } = {},
): Promise<'PENDING' | 'SUCCEEDED' | 'FAILED'> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) return 'FAILED'
  if (payment.status === 'SUCCEEDED') return 'SUCCEEDED'
  if (payment.status !== 'PENDING') return 'FAILED'

  const isMobileMoney = payment.method === 'MOMO' || payment.method === 'OM'
  if (!isMobileMoney || !payment.providerRef || !payment.phoneNumber) return 'PENDING'
  if (opts.gatewayOnly && !fapshiConfigured()) return 'PENDING'

  if (fapshiConfigured()) {
    const last = lastCheck.get(payment.providerRef) ?? 0
    if (Date.now() - last < MIN_GAP_MS) return 'PENDING'
    lastCheck.set(payment.providerRef, Date.now())
  }

  const provider = getProvider(payment.method as PaymentProviderId)
  const remote = await provider.getStatus(payment.providerRef, payment.createdAt, payment.phoneNumber)
  if (remote.status === 'SUCCEEDED') {
    await confirmPayment(payment.id)
    return 'SUCCEEDED'
  }
  if (remote.status === 'FAILED') {
    await failPayment(payment.id, remote.failureReason ?? 'Paiement refusé.')
    return 'FAILED'
  }
  return 'PENDING'
}
