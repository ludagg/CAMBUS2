import { describe, expect, it } from 'vitest'
import { dayRange, isValidDateKey, localDateKey } from '../lib/datetime'

describe('datetime (Africa/Douala, UTC+1)', () => {
  it('maps a 23:30 UTC instant to the next local day', () => {
    expect(localDateKey(new Date('2026-10-14T23:30:00Z'))).toBe('2026-10-15')
  })

  it('keeps a 22:59 UTC instant on the same local day', () => {
    expect(localDateKey(new Date('2026-10-14T22:59:00Z'))).toBe('2026-10-14')
  })

  it('builds day ranges anchored on +01:00', () => {
    const { start, end } = dayRange('2026-10-15')
    expect(start.toISOString()).toBe('2026-10-14T23:00:00.000Z')
    expect(end.toISOString()).toBe('2026-10-15T22:59:59.999Z')
  })

  it('validates date keys', () => {
    expect(isValidDateKey('2026-10-15')).toBe(true)
    expect(isValidDateKey('15/10/2026')).toBe(false)
    expect(isValidDateKey('2026-13-40')).toBe(false)
  })
})
