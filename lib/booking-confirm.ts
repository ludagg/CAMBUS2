import { prisma } from './prisma'
import {
  getEmailProvider,
  getSmsProvider,
  renderBookingEmail,
  renderBookingSms,
  toE164Cameroon,
} from './notifications'

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
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCEEDED' },
      }),
      prisma.bookingGroup.update({
        where: { id: payment.groupId },
        data: { status: 'CONFIRMED', expiresAt: null },
      }),
      prisma.booking.updateMany({
        where: { groupId: payment.groupId },
        data: { status: 'CONFIRMED' },
      }),
    ])
  }

  await sendBookingNotifications(payment.groupId).catch((err) => {
    console.error('[notifications] failed for group', payment.groupId, err)
  })
}

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

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason: reason },
    }),
    prisma.bookingGroup.update({
      where: { id: payment.groupId },
      data: { status: 'CANCELLED' },
    }),
    prisma.booking.updateMany({
      where: { groupId: payment.groupId },
      data: { status: 'CANCELLED' },
    }),
    prisma.bookingSeat.deleteMany({
      where: { bookingId: { in: bookingIds } },
    }),
    ...payment.group.bookings.map((b) =>
      prisma.departure.update({
        where: { id: b.departureId },
        data: { seatsAvailable: { increment: b.passengers.length || 1 } },
      }),
    ),
  ])
}

async function sendBookingNotifications(groupId: string): Promise<void> {
  const group = await prisma.bookingGroup.findUnique({
    where: { id: groupId },
    include: {
      bookings: {
        include: {
          departure: {
            include: {
              route: {
                include: {
                  originCity: { select: { name: true } },
                  destinationCity: { select: { name: true } },
                },
              },
              originStation: { select: { name: true } },
              destStation: { select: { name: true } },
            },
          },
        },
      },
    },
  })
  if (!group || group.notifiedAt) return

  const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://easytravel.cm'
  const email = renderBookingEmail({
    contactName: group.contactName || 'Client Easy Travel',
    currency: group.currency,
    totalCents: group.totalCents,
    publicBaseUrl,
    bookings: group.bookings.map((b) => ({
      from: b.departure.route.originCity.name,
      to: b.departure.route.destinationCity.name,
      date: b.departure.departureAt.toISOString().split('T')[0],
      departureTime: b.departure.departureAt.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      seats: b.seats,
      qrCode: b.qrCode,
      leg: b.leg,
    })),
  })

  await Promise.allSettled([
    getEmailProvider().send({
      to: group.contactEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
    ...group.bookings.map((b) =>
      getSmsProvider().send({
        to: toE164Cameroon(group.contactPhone),
        body: renderBookingSms({
          fromCity: b.departure.route.originCity.name,
          toCity: b.departure.route.destinationCity.name,
          departureAt: b.departure.departureAt.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          seats: b.seats,
          publicBaseUrl,
        }),
      }),
    ),
  ])

  await prisma.bookingGroup.update({
    where: { id: groupId },
    data: { notifiedAt: new Date() },
  })
}
