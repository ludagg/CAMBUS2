import { describe, it, expect } from 'vitest'
import { normalizeCameroonPhone, detectProviderForPhone } from '../lib/payment'
import { toE164Cameroon } from '../lib/notifications'

describe('normalizeCameroonPhone', () => {
  it('strips spaces and +237', () => {
    expect(normalizeCameroonPhone('+237 6 55 12 34 56')).toBe('655123456')
    expect(normalizeCameroonPhone('237655123456')).toBe('655123456')
    expect(normalizeCameroonPhone('655 123 456')).toBe('655123456')
  })

  it('rejects invalid formats', () => {
    expect(normalizeCameroonPhone('12345')).toBeNull()
    expect(normalizeCameroonPhone('755123456')).toBeNull() // must start with 6
    expect(normalizeCameroonPhone('')).toBeNull()
  })
})

describe('detectProviderForPhone', () => {
  it('routes 69X to Orange Money', () => {
    expect(detectProviderForPhone('690000000')).toBe('OM')
  })
  it('routes 67X/68X to MTN MoMo', () => {
    expect(detectProviderForPhone('678000000')).toBe('MOMO')
    expect(detectProviderForPhone('671234567')).toBe('MOMO')
  })
})

describe('toE164Cameroon', () => {
  it('adds +237 prefix for local 9-digit numbers', () => {
    expect(toE164Cameroon('655123456')).toBe('+237655123456')
  })
  it('keeps 237-prefixed numbers intact', () => {
    expect(toE164Cameroon('237655123456')).toBe('+237655123456')
  })
})
