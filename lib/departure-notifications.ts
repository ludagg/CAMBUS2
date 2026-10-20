import { prisma } from './prisma'
import { getEmailProvider, getSmsProvider, toE164Cameroon } from './notifications'

type ChangeKind = 'DELAYED' | 'CANCELLED'

/**
 * Notifies all passengers of a departure (active bookings only) about a
 * delay or cancellation. Guarded by `passengersNotifiedAt` to prevent spam
 * on repeated admin clicks — a subsequent delay/cancel update resets the
 * guard via `passengersNotifiedAt: null` in the caller.
 */
export async function notifyDepartureChange(
  departureId: string,
  kind: ChangeKind,
  options: { delayMinutes?: number; reason?: string } = {},
): Promise<void> {
  const dep = await prisma.departure.findUnique({
    where: { id: departureId },
    include: {
      route: {
        include: {
          originCity: { select: { name: true } },
          destinationCity: { select: { name: true } },
          company: { select: { name: true } },
        },
      },
      bookings: {
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        include: { group: true },
      },
    },
  })
  if (!dep) return

  const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://easytravel.cm'
  const originalTime = dep.departureAt.toLocaleString('fr-FR', { timeZone: 'Africa/Douala',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const newTime = options.delayMinutes
    ? new Date(dep.departureAt.getTime() + options.delayMinutes * 60_000).toLocaleString(
        'fr-FR',
        { timeZone: 'Africa/Douala', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' },
      )
    : null

  const routeLabel = `${dep.route.originCity.name} → ${dep.route.destinationCity.name}`

  const subject =
    kind === 'DELAYED'
      ? `Easy Travel · ${routeLabel} retardé de ${options.delayMinutes}min`
      : `Easy Travel · ${routeLabel} annulé`

  const recipientsSeen = new Set<string>()
  const tasks: Promise<unknown>[] = []

  for (const booking of dep.bookings) {
    const g = booking.group
    if (!g) continue
    const key = `${g.contactEmail}|${g.contactPhone}`
    if (recipientsSeen.has(key)) continue
    recipientsSeen.add(key)

    const lines = [
      `Bonjour ${g.contactName || 'Client Easy Travel'},`,
      '',
      kind === 'DELAYED'
        ? `Votre voyage ${routeLabel} prévu le ${originalTime} est retardé de ${options.delayMinutes} minutes.`
        : `Votre voyage ${routeLabel} prévu le ${originalTime} a été annulé.`,
      newTime ? `Nouvelle heure de départ : ${newTime}.` : '',
      options.reason ? `Motif : ${options.reason}` : '',
      '',
      kind === 'CANCELLED'
        ? `Vous serez remboursé automatiquement si votre paiement est validé. Retrouvez vos billets sur ${publicBaseUrl}/bookings pour réserver un autre départ.`
        : `Retrouvez vos billets sur ${publicBaseUrl}/bookings.`,
      '',
      `Merci de votre compréhension.`,
      `— L'équipe ${dep.route.company.name}`,
    ].filter(Boolean)
    const text = lines.join('\n')
    const html = `<pre style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;white-space:pre-wrap;line-height:1.5">${text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')}</pre>`

    const smsBody =
      kind === 'DELAYED'
        ? `Easy Travel: ${routeLabel} retardé de ${options.delayMinutes}min. Nouveau départ ${newTime}. ${publicBaseUrl}/bookings`
        : `Easy Travel: ${routeLabel} du ${originalTime} ANNULE. ${options.reason || ''} Info ${publicBaseUrl}/bookings`

    tasks.push(
      getEmailProvider()
        .send({ to: g.contactEmail, subject, html, text })
        .catch((err) => console.error('[notif] email fail', err)),
    )
    tasks.push(
      getSmsProvider()
        .send({ to: toE164Cameroon(g.contactPhone), body: smsBody })
        .catch((err) => console.error('[notif] sms fail', err)),
    )
  }

  await Promise.allSettled(tasks)
  await prisma.departure.update({
    where: { id: departureId },
    data: { passengersNotifiedAt: new Date() },
  })
}
