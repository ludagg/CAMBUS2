import { prisma } from './prisma'
import { sendBookingNotifications } from './send-booking-notifications'
import { promoteWaitlistForDeparture } from './waitlist'

/**
 * Confirm a payment: flip payment + group + bookings to CONFIRMED and trigger
 * the confirmation email + SMS exactly once (guarded by notifiedAt).
 *
 * Safe to call multiple times — if the payment is already SUCCEEDED and
 * notifications already sent, this is a no-op.
 */
export async function confirmPayment(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { group: true },
  })
  if (!payment) return
  if (payment.status === 'SUCCEEDED' && payment.group.notifiedAt) return

  if (payment.status !== 'SUCCEEDED') {
    // Conditional transition: only a still-PENDING payment may be confirmed,
    // so a concurrent failPayment (cron/expiry) cannot be silently overwritten.
    const confirmed = await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: { status: 'SUCCEEDED' },
      })
      if (claimed.count === 0) return false
      await tx.bookingGroup.update({
        where: { id: payment.groupId },
        data: { status: 'CONFIRMED', expiresAt: null },
      })
      await tx.booking.updateMany({
        where: { groupId: payment.groupId },
        data: { status: 'CONFIRMED' },
      })
      return true
    })
    if (!confirmed) return
  }

  await sendBookingNotifications(payment.groupId).catch((err) => {
    console.error('[notifications] failed for group', payment.groupId, err)
  })
}

export { sendBookingNotifications }

/**
 * Fail a payment: flip payment + group + bookings to CANCELLED/FAILED,
 * release seat rows (BookingSeat) and restore seatsAvailable.
 */
export async function failPayment(paymentId: string, reason: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      group: {
        include: {
          bookings: {
            include: { passengers: true },
          },
        },
      },
    },
  })
  if (!payment) return
  if (payment.status === 'FAILED' || payment.status === 'REFUNDED') return

  const bookingIds = payment.group.bookings.map((b) => b.id)

  // Conditional transition: only a still-PENDING payment may fail. If it was
  // confirmed (or already failed) in the meantime, do not release the seats.
  const failed = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'FAILED', failureReason: reason },
    })
    if (claimed.count === 0) return false
    await tx.bookingGroup.update({
      where: { id: payment.groupId },
      data: { status: 'CANCELLED' },
    })
    await tx.booking.updateMany({
      where: { groupId: payment.groupId },
      data: { status: 'CANCELLED' },
    })
    await tx.bookingSeat.deleteMany({ where: { bookingId: { in: bookingIds } } })
    for (const b of payment.group.bookings) {
      await tx.departure.update({
        where: { id: b.departureId },
        data: { seatsAvailable: { increment: b.passengers.length || 1 } },
      })
    }
    return true
  })
  if (!failed) return

  // Best-effort waitlist promotion — failures don't roll back the cancellation.
  const seen = new Set<string>()
  for (const b of payment.group.bookings) {
    if (seen.has(b.departureId)) continue
    seen.add(b.departureId)
    try {
      await promoteWaitlistForDeparture(b.departureId)
    } catch (err) {
      console.error('[fail-payment] waitlist promotion failed', b.departureId, err)
    }
  }
}
