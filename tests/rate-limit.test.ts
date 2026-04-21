import { describe, it, expect } from 'vitest'
import { rateLimit } from '../lib/rate-limit'

describe('rateLimit', () => {
  it('allows up to the limit then rejects', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, { limit: 3, windowSec: 60 }).ok).toBe(true)
    }
    const res = rateLimit(key, { limit: 3, windowSec: 60 })
    expect(res.ok).toBe(false)
    expect(res.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('isolates buckets by key', () => {
    const a = `test-${Math.random()}`
    const b = `test-${Math.random()}`
    rateLimit(a, { limit: 1, windowSec: 60 })
    expect(rateLimit(a, { limit: 1, windowSec: 60 }).ok).toBe(false)
    expect(rateLimit(b, { limit: 1, windowSec: 60 }).ok).toBe(true)
  })
})
