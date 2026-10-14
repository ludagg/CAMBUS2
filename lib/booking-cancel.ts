import { prisma } from './prisma'
import {
  resolveCompanyPolicy,
  computeRefundPercent,
  isWithinDeadline,
  type ResolvedPolicy,
} from './cancellation-policy'
import { promoteWaitlistForDeparture } from './waitlist'

export class CancellationError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'CancellationError'
  }
}

export interface CancellationOutcome {
  refundPercent: number
  refundAmountCents: number
  policyWasDefault: boolean
}

/**
 * Cancel a BookingGroup on behalf of the owner (or an admin).
 * - Requires the group to be PENDING or CONFIRMED.
 * - Enforces the company's CancellationPolicy (falls back to a default
 *   >24h/100%, 2-24h/50%, <2h/0%, deadline 2h).
 * - Releases BookingSeat rows, restores seatsAvailable on each Departure,
 *   marks the group + bookings CANCELLED, and flips the Payment row:
 *     PENDING   -> FAILED (with reason)
 *     SUCCEEDED -> REFUNDED (real money movement is not performed here — this
 *                 only records the accounting state; the finance team runs the
 *                 actual refund through the MoMo/OM provider dashboard).
 * - Triggers waitlist promotion on the affected departures.
 */
export async function cancelBookingGroup(
  groupId: string,
  opts: {
    actorUserId: string
    reason?: string
    /** Company-initiated cancellation (e.g. trip cancelled): full refund, no deadline. */
    companyInitiated?: boolean
  },
): Promise<CancellationOutcome> {
  const group = await prisma.bookingGroup.findUnique({
    where: { id: groupId },
    include: {
      bookings: {
        include: {
          departure: {
            select: {
              id: true,
              departureAt: true,
              route: { select: { companyId: true } },
            },
          },
          passengers: { select: { id: true } },
        },
      },
      payment: true,
    },
  })
  if (!group) throw new CancellationError('Réservation introuvable.', 404)

  if (group.status === 'CANCELLED') {
    throw new CancellationError('Cette réservation est déjà annulée.', 409)
  }
  if (group.status === 'BOARDED') {
    throw new CancellationError(
      "Impossible d'annuler: le voyage est déjà commencé.",
      409,
    )
  }

  const earliestBooking = group.bookings.reduce<
    typeof group.bookings[number] | null
  >((acc, b) => {
    if (!acc) return b
    return b.departure.departureAt < acc.departure.departureAt ? b : acc
  }, null)

  let policy: ResolvedPolicy | null = null
  if (earliestBooking) {
    policy = await resolveCompanyPolicy(
      earliestBooking.departure.route.companyId,
    )
    const earliestAt = earliestBooking.departure.departureAt
    if (!opts.companyInitiated && !isWithinDeadline(policy, earliestAt)) {
      throw new CancellationError(
        `Annulation impossible: moins de ${policy.deadlineHours} h avant le départ.`,
        409,
      )
    }
  }

  const bookingIds = group.bookings.map((b) => b.id)
  const reason =
    opts.reason?.trim() || `Annulée par l'utilisateur ${opts.actorUserId}.`

  const refundPercent = opts.companyInitiated
    ? 100
    : policy && earliestBooking
    ? computeRefundPercent(policy, earliestBooking.departure.departureAt)
    : 0
  const paidAmountCents = group.payment?.amountCents ?? 0
  const refundAmountCents = Math.round((paidAmountCents * refundPercent) / 100)

  const reasonWithPolicy = policy
    ? `${reason} — Remboursement: ${refundPercent}% (${refundAmountCents} ${
        group.payment?.currency ?? 'XAF'
      })`
    : reason

  await prisma.$transaction(async (tx) => {
    // Claim the group atomically so concurrent cancels cannot double-restore seats.
    const claimed = await tx.bookingGroup.updateMany({
      where: { id: group.id, status: { in: ['PENDING', 'CONFIRMED'] } },
      data: { status: 'CANCELLED', expiresAt: null },
    })
    if (claimed.count === 0) {
      throw new CancellationError('Cette réservation ne peut plus être annulée.', 409)
    }
    // A leg that already boarded is never cancelled nor its seats restored.
    const cancellable = group.bookings.filter((b) => b.status !== 'BOARDED')
    const cancellableIds = cancellable.map((b) => b.id)
    await tx.bookingSeat.deleteMany({ where: { bookingId: { in: cancellableIds } } })
    for (const b of cancellable) {
      await tx.departure.update({
        where: { id: b.departure.id },
        data: {
          seatsAvailable: {
            increment: Math.max(1, b.passengers.length || b.seats.length || 1),
          },
        },
      })
    }
    await tx.booking.updateMany({
      where: { id: { in: cancellableIds } },
      data: { status: 'CANCELLED' },
    })
    if (group.payment) {
      await tx.payment.update({
        where: { id: group.payment.id },
        data:
          group.payment.status === 'SUCCEEDED'
            ? refundPercent > 0
              ? { status: 'REFUNDED', failureReason: reasonWithPolicy }
              : { failureReason: reasonWithPolicy }
            : group.payment.status === 'PENDING'
              ? { status: 'FAILED', failureReason: reasonWithPolicy }
              : { failureReason: reasonWithPolicy },
      })
    }
  })

  // Best-effort waitlist promotion. Failures here must not roll back the
  // cancellation itself — waitlist notifications can be retried later.
  for (const booking of group.bookings) {
    try {
      await promoteWaitlistForDeparture(booking.departure.id)
    } catch (err) {
      console.error(
        '[cancel] waitlist promotion failed for departure',
        booking.departure.id,
        err,
      )
    }
  }

  return {
    refundPercent,
    refundAmountCents,
    policyWasDefault: policy?.isDefault ?? true,
  }
}
