/**
 * Business time zone helpers. Cameroon is UTC+1 all year (no DST), but
 * serverless hosts run in UTC, so never rely on the server's local zone.
 */
export const BUSINESS_TZ = 'Africa/Douala'
const OFFSET = '+01:00'

/** YYYY-MM-DD of an instant, as seen in Cameroon. */
export function localDateKey(d: Date): string {
  return new Date(d.getTime() + 60 * 60 * 1000).toISOString().split('T')[0]
}

export function todayLocal(): string {
  return localDateKey(new Date())
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateKey(s: string): boolean {
  return DATE_RE.test(s) && !Number.isNaN(new Date(`${s}T00:00:00${OFFSET}`).getTime())
}

/** [start, end] instants of a Cameroon calendar day. */
export function dayRange(dateKey: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dateKey}T00:00:00.000${OFFSET}`),
    end: new Date(`${dateKey}T23:59:59.999${OFFSET}`),
  }
}
