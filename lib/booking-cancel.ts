import { prisma } from './prisma'

const CANCELLATION_DEADLINE_HOURS = Number(
  process.env.CANCELLATION_DEADLINE_HOURS ?? 2,
)

export class CancellationError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'CancellationError'
  }
}

/**
 * Cancel a BookingGroup on behalf of the owner (or an admin).
 * - Requires the group to be PENDING or CONFIRMED.
 * - Enforces CANCELLATION_DEADLINE_HOURS before the earliest departure.
 * - Releases BookingSeat rows, restores seatsAvailable on each Departure,
 *   marks the group + bookings CANCELLED, and flips the Payment row:
 *     PENDING   -> FAILED (with reason)
 *     SUCCEEDED -> REFUNDED (real money movement is not performed here — this
 *                 only records the accounting state; the finance team runs the
 *                 actual refund through the MoMo/OM provider dashboard).
 */
export async function cancelBookingGroup(
  groupId: string,
  opts: { actorUserId: string; reason?: string },
): Promise<void> {
  const group = await prisma.bookingGroup.findUnique({
    where: { id: groupId },
    include: {
      bookings: {
        include: {
          departure: { select: { id: true, departureAt: true } },
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

  const earliest = group.bookings.reduce<Date | null>((acc, b) => {
    const d = b.departure.departureAt
    return !acc || d < acc ? d : acc
  }, null)
  if (earliest) {
    const cutoff = new Date(
      earliest.getTime() - CANCELLATION_DEADLINE_HOURS * 3600 * 1000,
    )
    if (Date.now() > cutoff.getTime()) {
      throw new CancellationError(
        `Annulation impossible moins de ${CANCELLATION_DEADLINE_HOURS} h avant le départ.`,
        409,
      )
    }
  }

  const bookingIds = group.bookings.map((b) => b.id)
  const reason =
    opts.reason?.trim() || `Annulée par l'utilisateur ${opts.actorUserId}.`

  await prisma.$transaction([
    prisma.bookingSeat.deleteMany({
      where: { bookingId: { in: bookingIds } },
    }),
    ...group.bookings.map((b) =>
      prisma.departure.update({
        where: { id: b.departure.id },
        data: {
          seatsAvailable: {
            increment: Math.max(1, b.passengers.length || b.seats.length || 1),
          },
        },
      }),
    ),
    prisma.booking.updateMany({
      where: { groupId: group.id },
      data: { status: 'CANCELLED' },
    }),
    prisma.bookingGroup.update({
      where: { id: group.id },
      data: { status: 'CANCELLED', expiresAt: null },
    }),
    ...(group.payment
      ? [
          prisma.payment.update({
            where: { id: group.payment.id },
            data:
              group.payment.status === 'SUCCEEDED'
                ? { status: 'REFUNDED', failureReason: reason }
                : group.payment.status === 'PENDING'
                  ? { status: 'FAILED', failureReason: reason }
                  : { failureReason: reason },
          }),
        ]
      : []),
  ])
}
