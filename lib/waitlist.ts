import { prisma } from './prisma'
import {
  getEmailProvider,
  getSmsProvider,
  toE164Cameroon,
} from './notifications'

/**
 * Default hold duration offered to a promoted waitlist entry: the user has
 * 15 minutes after notification to book before the hold expires and the seat
 * goes back to the next entry.
 */
const WAITLIST_HOLD_MINUTES = Number(process.env.WAITLIST_HOLD_MINUTES ?? 15)

export class WaitlistError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'WaitlistError'
  }
}

/**
 * Add the given user/passenger to the waitlist of a departure. Requires the
 * departure to be full (seatsAvailable <= 0). Enforces one WAITING entry per
 * (user, departure) pair.
 */
export async function joinWaitlist(input: {
  departureId: string
  userId?: string | null
  passengerFullName: string
  phone?: string | null
  email?: string | null
  seatsRequested?: number
}): Promise<{ id: string; position: number }> {
  const departure = await prisma.departure.findUnique({
    where: { id: input.departureId },
    select: {
      id: true,
      seatsAvailable: true,
      status: true,
      tripStatus: true,
      departureAt: true,
    },
  })
  if (!departure) throw new WaitlistError('Départ introuvable.', 404)
  if (departure.status === 'INACTIVE')
    throw new WaitlistError('Ce départ est désactivé.', 409)
  if (departure.tripStatus !== 'SCHEDULED' && departure.tripStatus !== 'DELAYED')
    throw new WaitlistError(
      "Ce départ n'accepte plus de liste d'attente.",
      409,
    )
  if (departure.departureAt.getTime() <= Date.now())
    throw new WaitlistError('Ce départ est déjà passé.', 409)
  if (departure.seatsAvailable > 0)
    throw new WaitlistError(
      "Des places sont disponibles — réservez directement au lieu de rejoindre la liste d'attente.",
      409,
    )

  if (input.userId) {
    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        departureId: input.departureId,
        userId: input.userId,
        status: { in: ['WAITING', 'NOTIFIED'] },
      },
      select: { id: true },
    })
    if (existing)
      throw new WaitlistError(
        "Vous êtes déjà sur la liste d'attente de ce départ.",
        409,
      )
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      departureId: input.departureId,
      userId: input.userId ?? null,
      passengerFullName: input.passengerFullName,
      phone: input.phone ?? null,
      email: input.email ?? null,
      seatsRequested: Math.max(1, input.seatsRequested ?? 1),
    },
  })

  const position = await prisma.waitlistEntry.count({
    where: {
      departureId: input.departureId,
      status: 'WAITING',
      createdAt: { lte: entry.createdAt },
    },
  })

  return { id: entry.id, position }
}

/**
 * Promote pending waitlist entries when seats become available on a departure.
 * Called after a cancellation or a release-pending event. Consumes entries in
 * FIFO order (oldest first), updates them to NOTIFIED with a holdExpiresAt,
 * and notifies the passenger via email + SMS (best-effort).
 *
 * Returns the count of entries that were promoted.
 */
export async function promoteWaitlistForDeparture(
  departureId: string,
): Promise<number> {
  const departure = await prisma.departure.findUnique({
    where: { id: departureId },
    select: {
      id: true,
      seatsAvailable: true,
      status: true,
      tripStatus: true,
      departureAt: true,
      route: {
        include: { originCity: true, destinationCity: true },
      },
    },
  })
  if (!departure) return 0
  if (departure.status === 'INACTIVE') return 0
  if (departure.tripStatus === 'CANCELLED' || departure.tripStatus === 'COMPLETED')
    return 0
  if (departure.seatsAvailable <= 0) return 0
  if (departure.departureAt.getTime() <= Date.now()) return 0

  let seatsLeft = departure.seatsAvailable
  let promoted = 0
  const hold = WAITLIST_HOLD_MINUTES * 60 * 1000

  // Pull a small FIFO batch; repeat until we exhaust seats or the queue.
  while (seatsLeft > 0) {
    const next = await prisma.waitlistEntry.findFirst({
      where: { departureId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
    })
    if (!next) break
    if (next.seatsRequested > seatsLeft) {
      // Skip this entry for now; tighter matches may come later. Mark NOTIFIED
      // only when we can honour the seat count requested.
      break
    }
    const now = new Date()
    await prisma.waitlistEntry.update({
      where: { id: next.id },
      data: {
        status: 'NOTIFIED',
        notifiedAt: now,
        holdExpiresAt: new Date(now.getTime() + hold),
      },
    })
    await notifyWaitlistEntry(next.id, departure)
    seatsLeft -= next.seatsRequested
    promoted += 1
  }

  return promoted
}

async function notifyWaitlistEntry(
  entryId: string,
  departure: {
    id: string
    departureAt: Date
    route: {
      originCity: { name: string }
      destinationCity: { name: string }
    }
  },
): Promise<void> {
  const entry = await prisma.waitlistEntry.findUnique({
    where: { id: entryId },
  })
  if (!entry) return

  const when = departure.departureAt.toLocaleString('fr-FR', { timeZone: 'Africa/Douala',
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const trip = `${departure.route.originCity.name} → ${departure.route.destinationCity.name}`
  const minutes = WAITLIST_HOLD_MINUTES

  if (entry.email) {
    try {
      await getEmailProvider().send({
        to: entry.email,
        subject: `Place disponible — ${trip}`,
        text: `Bonjour ${entry.passengerFullName},\n\nUne place vient de se libérer sur votre départ ${trip} du ${when}.\nVous disposez de ${minutes} minutes pour finaliser votre réservation avant qu'elle ne soit proposée à la personne suivante.\n\nEasy Travel`,
        html: `<p>Bonjour ${entry.passengerFullName},</p><p>Une place vient de se libérer sur votre départ <strong>${trip}</strong> du <strong>${when}</strong>.</p><p>Vous disposez de <strong>${minutes} minutes</strong> pour finaliser votre réservation avant qu'elle ne soit proposée à la personne suivante.</p><p>— Easy Travel</p>`,
      })
    } catch (err) {
      console.error('[waitlist] email failed', entry.id, err)
    }
  }
  if (entry.phone) {
    try {
      await getSmsProvider().send({
        to: toE164Cameroon(entry.phone),
        body: `Easy Travel: place libre ${trip} le ${when}. Vous avez ${minutes} min pour réserver.`,
      })
    } catch (err) {
      console.error('[waitlist] sms failed', entry.id, err)
    }
  }
}

/**
 * Expire waitlist entries whose holdExpiresAt has passed without the user
 * completing a booking. Safe to call from cron.
 */
export async function expireStaleWaitlistHolds(
  now: Date = new Date(),
): Promise<number> {
  const result = await prisma.waitlistEntry.updateMany({
    where: {
      status: 'NOTIFIED',
      holdExpiresAt: { lt: now },
      promotedGroupId: null,
    },
    data: { status: 'EXPIRED' },
  })
  return result.count
}
