import { localDateKey } from './datetime'
import { prisma } from './prisma'
import {
  getEmailProvider,
  getSmsProvider,
  renderBookingEmail,
  renderBookingSms,
  toE164Cameroon,
} from './notifications'

export type NotificationChannel = 'email' | 'sms' | 'both'

/**
 * Send (or re-send) the booking confirmation email/SMS for a group.
 *
 * - Called once on the first payment confirmation (via confirmPayment).
 * - Also exposed to /api/bookings/:groupId/resend so the user can re-request
 *   the billet.
 *
 * The first successful send writes `notifiedAt` on the group so the
 * deduplication inside confirmPayment still works; subsequent calls simply
 * re-trigger the provider without resetting that timestamp.
 */
export async function sendBookingNotifications(
  groupId: string,
  opts: { channel?: NotificationChannel; publicBaseUrl?: string } = {},
): Promise<{ emailSent: boolean; smsSent: number }> {
  const channel: NotificationChannel = opts.channel ?? 'both'
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
  if (!group) throw new Error(`BookingGroup ${groupId} introuvable.`)

  const publicBaseUrl =
    opts.publicBaseUrl ?? process.env.PUBLIC_BASE_URL ?? 'https://easytravel.cm'

  const email = renderBookingEmail({
    contactName: group.contactName || 'Client Easy Travel',
    currency: group.currency,
    totalCents: group.totalCents,
    publicBaseUrl,
    bookings: group.bookings.map((b) => ({
      from: b.departure.route.originCity.name,
      to: b.departure.route.destinationCity.name,
      date: localDateKey(b.departure.departureAt),
      departureTime: b.departure.departureAt.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Douala',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      seats: b.seats,
      qrCode: b.qrCode,
      leg: b.leg,
    })),
  })

  const jobs: Promise<unknown>[] = []
  let emailSent = false
  let smsSent = 0

  if (channel === 'email' || channel === 'both') {
    jobs.push(
      getEmailProvider()
        .send({
          to: group.contactEmail,
          subject: email.subject,
          html: email.html,
          text: email.text,
        })
        .then(() => {
          emailSent = true
        }),
    )
  }

  if (channel === 'sms' || channel === 'both') {
    for (const b of group.bookings) {
      jobs.push(
        getSmsProvider()
          .send({
            to: toE164Cameroon(group.contactPhone),
            body: renderBookingSms({
              fromCity: b.departure.route.originCity.name,
              toCity: b.departure.route.destinationCity.name,
              departureAt: b.departure.departureAt.toLocaleString('fr-FR', { timeZone: 'Africa/Douala',
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }),
              seats: b.seats,
              publicBaseUrl,
            }),
          })
          .then(() => {
            smsSent += 1
          }),
      )
    }
  }

  await Promise.allSettled(jobs)

  if (!group.notifiedAt && (emailSent || smsSent > 0)) {
    await prisma.bookingGroup.update({
      where: { id: groupId },
      data: { notifiedAt: new Date() },
    })
  }

  return { emailSent, smsSent }
}
