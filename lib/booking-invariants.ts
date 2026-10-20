import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

/**
 * Transactional helper: mark a single Booking as BOARDED, and promote the
 * parent BookingGroup to BOARDED when every booking in the group has boarded.
 *
 * Without this helper the invariant `BookingGroup.status === BOARDED iff all
 * child Booking rows are BOARDED` can drift — the check-in endpoint updated
 * only the individual Booking, leaving the group in CONFIRMED forever.
 */
export class AlreadyBoardedError extends Error {
  constructor() {
    super('Billet déjà validé.')
  }
}

export async function boardBookingAndSyncGroup(bookingId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Conditional update so two concurrent scans of the same QR cannot both succeed.
    const claimed = await tx.booking.updateMany({
      where: { id: bookingId, status: 'CONFIRMED' },
      data: { status: 'BOARDED' },
    })
    if (claimed.count === 0) throw new AlreadyBoardedError()
    const booking = await tx.booking.findUniqueOrThrow({
      where: { id: bookingId },
      select: { groupId: true },
    })
    const siblings = await tx.booking.findMany({
      where: { groupId: booking.groupId },
      select: { status: true },
    })
    const allBoarded = siblings.every((s) => s.status === 'BOARDED')
    if (allBoarded) {
      await tx.bookingGroup.update({
        where: { id: booking.groupId },
        data: { status: 'BOARDED' },
      })
    }
  })
}

/**
 * Returns the count of bookings in states that would be "orphaned" if the
 * referenced entity were soft-deleted. Callers should refuse the delete when
 * this count is > 0.
 */
export async function countActiveBookingsForAgency(
  agencyId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<number> {
  return tx.booking.count({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      departure: {
        agencyId,
        departureAt: { gt: new Date() },
      },
    },
  })
}

export async function countActiveBookingsForCompany(
  companyId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<number> {
  return tx.booking.count({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      departure: {
        agency: { companyId },
        departureAt: { gt: new Date() },
      },
    },
  })
}

export async function countActiveBookingsForVehicle(
  vehicleId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<number> {
  return tx.booking.count({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      departure: {
        vehicleId,
        departureAt: { gt: new Date() },
      },
    },
  })
}
