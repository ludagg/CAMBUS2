import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { syncPendingPayment } from '@/lib/payment-sync'
import { failPayment } from '@/lib/booking-confirm'

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
        // Ask the real gateway first: the customer may have paid right at the deadline.
        const state = await syncPendingPayment(payment.id, { gatewayOnly: true })
        if (state === 'PENDING') await failPayment(payment.id, 'Délai de confirmation dépassé.')
      } else if (isMobileMoney) {
        await syncPendingPayment(payment.id)
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
