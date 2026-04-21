import { prisma } from './prisma'

export interface PolicyTier {
  minHoursBeforeDeparture: number
  refundPercent: number
}

export interface ResolvedPolicy {
  deadlineHours: number
  tiers: PolicyTier[]
  isDefault: boolean
  notes?: string | null
}

/**
 * Default cancellation policy used when a company has not configured its own.
 * Paliers ordonnés du plus strict (grand seuil) au plus permissif : plus le
 * départ est proche, plus le remboursement est faible.
 */
export const DEFAULT_POLICY: ResolvedPolicy = {
  deadlineHours: 2,
  tiers: [
    { minHoursBeforeDeparture: 24, refundPercent: 100 },
    { minHoursBeforeDeparture: 2, refundPercent: 50 },
    { minHoursBeforeDeparture: 0, refundPercent: 0 },
  ],
  isDefault: true,
  notes: null,
}

/**
 * Load the company's cancellation policy, falling back to DEFAULT_POLICY.
 * Tiers are sorted descending by minHoursBeforeDeparture so the first tier
 * matching the current lead time wins (standard "waterfall" refund logic).
 */
export async function resolveCompanyPolicy(
  companyId: string,
): Promise<ResolvedPolicy> {
  const row = await prisma.cancellationPolicy.findUnique({
    where: { companyId },
  })
  if (!row) return DEFAULT_POLICY

  const parsed = parseTiers(row.tiers)
  if (!parsed) return DEFAULT_POLICY

  return {
    deadlineHours: row.deadlineHours,
    tiers: parsed,
    isDefault: false,
    notes: row.notes,
  }
}

/**
 * Compute the refund percentage (0-100) for a cancellation happening `now`
 * against a departure scheduled at `departureAt`. Returns the first tier
 * whose `minHoursBeforeDeparture` is <= the lead time, or 0 if none match.
 */
export function computeRefundPercent(
  policy: ResolvedPolicy,
  departureAt: Date,
  now: Date = new Date(),
): number {
  const hoursBefore = (departureAt.getTime() - now.getTime()) / 3_600_000
  if (hoursBefore < 0) return 0
  const sorted = [...policy.tiers].sort(
    (a, b) => b.minHoursBeforeDeparture - a.minHoursBeforeDeparture,
  )
  for (const tier of sorted) {
    if (hoursBefore >= tier.minHoursBeforeDeparture) {
      return Math.max(0, Math.min(100, Math.round(tier.refundPercent)))
    }
  }
  return 0
}

/**
 * Returns true when the cancellation is allowed (lead time >= deadlineHours).
 * Callers should translate `false` into a 409 response.
 */
export function isWithinDeadline(
  policy: ResolvedPolicy,
  departureAt: Date,
  now: Date = new Date(),
): boolean {
  if (policy.deadlineHours <= 0) return departureAt.getTime() > now.getTime()
  const hoursBefore = (departureAt.getTime() - now.getTime()) / 3_600_000
  return hoursBefore >= policy.deadlineHours
}

function parseTiers(raw: unknown): PolicyTier[] | null {
  if (!Array.isArray(raw)) return null
  const out: PolicyTier[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const { minHoursBeforeDeparture, refundPercent } = item as Record<
      string,
      unknown
    >
    if (
      typeof minHoursBeforeDeparture !== 'number' ||
      typeof refundPercent !== 'number' ||
      minHoursBeforeDeparture < 0 ||
      refundPercent < 0 ||
      refundPercent > 100
    ) {
      return null
    }
    out.push({ minHoursBeforeDeparture, refundPercent })
  }
  return out.length > 0 ? out : null
}

/**
 * Validate tiers shape coming from an API payload.
 */
export function validateTiers(raw: unknown): PolicyTier[] {
  const parsed = parseTiers(raw)
  if (!parsed) {
    throw new Error(
      'tiers invalide: tableau d\'objets { minHoursBeforeDeparture, refundPercent } requis (refundPercent 0-100).',
    )
  }
  return parsed
}
