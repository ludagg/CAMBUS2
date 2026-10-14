import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { getProvider, type PaymentProviderId } from '@/lib/payment'
import { confirmPayment, failPayment } from '@/lib/booking-confirm'

/**
 * GET /api/payments/:id
 *
 * Returns the current status of a payment. If still PENDING on a Mobile Money
 * provider, we poll the provider to refresh. If the payment expired
 * (BookingGroup.expiresAt past), we auto-fail to release seats.
 *
 * On transition to SUCCEEDED we fire the confirmation email + SMS.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['USER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])

    const { id } = await params
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { group: true },
    })
    if (!payment) return bad('Paiement introuvable.', 404)
    if (session!.role === 'USER' && payment.group.userId !== session!.sub) {
      return bad('Accès refusé.', 403)
    }

    const isMobileMoney = payment.method === 'MOMO' || payment.method === 'OM'

    if (payment.status === 'PENDING') {
      const expired = payment.group.expiresAt && payment.group.expiresAt.getTime() < Date.now()
      if (expired) {
        await failPayment(payment.id, 'Délai de confirmation dépassé.')
      } else if (isMobileMoney && payment.providerRef && payment.phoneNumber) {
        const provider = getProvider(payment.method as PaymentProviderId)
        const remote = await provider.getStatus(
          payment.providerRef,
          payment.createdAt,
          payment.phoneNumber,
        )
        if (remote.status === 'SUCCEEDED') {
          await confirmPayment(payment.id)
        } else if (remote.status === 'FAILED') {
          await failPayment(payment.id, remote.failureReason ?? 'Paiement refusé.')
        }
      }
    }

    const fresh = await prisma.payment.findUnique({ where: { id: payment.id } })
    return NextResponse.json({
      data: {
        id: fresh!.id,
        groupId: fresh!.groupId,
        method: fresh!.method,
        provider: fresh!.provider,
        phoneNumber: fresh!.phoneNumber,
        status: fresh!.status,
        amountCents: fresh!.amountCents,
        currency: fresh!.currency,
        failureReason: fresh!.failureReason,
        providerRef: fresh!.providerRef,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
