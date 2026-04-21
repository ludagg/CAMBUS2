import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { getProvider, type PaymentProviderId } from '@/lib/payment'

/**
 * GET /api/payments/:id
 *
 * Returns the current status of a payment. If the payment is still PENDING and
 * uses a Mobile Money provider, we call the provider to refresh its status
 * (simulated: auto-SUCCEEDED after 4s, auto-FAILED if phone ends with `000`).
 *
 * When the payment transitions to SUCCEEDED we flip the booking group and its
 * bookings to CONFIRMED. When it transitions to FAILED we release the reserved
 * seats and mark the group/bookings CANCELLED.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['USER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])

    const { id } = await params
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        group: { include: { bookings: { include: { departure: true } } } },
      },
    })
    if (!payment) return bad('Paiement introuvable.', 404)
    if (payment.group.userId && payment.group.userId !== session!.sub && session!.role === 'USER') {
      return bad('Accès refusé.', 403)
    }

    const isMobileMoney = payment.method === 'MOMO' || payment.method === 'OM'

    if (payment.status === 'PENDING' && isMobileMoney && payment.providerRef && payment.phoneNumber) {
      const provider = getProvider(payment.method as PaymentProviderId)
      const remote = await provider.getStatus(payment.providerRef, payment.createdAt, payment.phoneNumber)

      if (remote.status === 'SUCCEEDED') {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'SUCCEEDED' },
          }),
          prisma.bookingGroup.update({
            where: { id: payment.groupId },
            data: { status: 'CONFIRMED' },
          }),
          prisma.booking.updateMany({
            where: { groupId: payment.groupId },
            data: { status: 'CONFIRMED' },
          }),
        ])
      } else if (remote.status === 'FAILED') {
        const passengerCounts = await prisma.passenger.groupBy({
          by: ['bookingId'],
          where: { bookingId: { in: payment.group.bookings.map((b) => b.id) } },
          _count: { _all: true },
        })

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED', failureReason: remote.failureReason ?? 'Payment failed' },
          }),
          prisma.bookingGroup.update({
            where: { id: payment.groupId },
            data: { status: 'CANCELLED' },
          }),
          prisma.booking.updateMany({
            where: { groupId: payment.groupId },
            data: { status: 'CANCELLED' },
          }),
          ...payment.group.bookings.map((b) => {
            const count = passengerCounts.find((p) => p.bookingId === b.id)?._count._all ?? 1
            return prisma.departure.update({
              where: { id: b.departureId },
              data: { seatsAvailable: { increment: count } },
            })
          }),
        ])
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
