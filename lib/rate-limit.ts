/**
 * Lightweight in-memory rate limiter for login/register/etc.
 *
 * Not suitable for horizontally-scaled production (each instance has its own
 * buckets) — swap for Upstash/Redis when we move beyond a single Vercel
 * deployment. Acceptable today because Vercel currently runs a single
 * server-side function per request region and the attack surface is brute
 * force on auth, not a DDoS.
 */

import { NextRequest } from 'next/server'

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  ok: boolean
  retryAfterSeconds: number
  remaining: number
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowSec: number },
): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowSec * 1000 })
    return { ok: true, retryAfterSeconds: 0, remaining: opts.limit - 1 }
  }
  if (bucket.count >= opts.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
      remaining: 0,
    }
  }
  bucket.count += 1
  return { ok: true, retryAfterSeconds: 0, remaining: opts.limit - bucket.count }
}

export function clientKey(req: NextRequest, prefix: string): string {
  // The first X-Forwarded-For entry is client-controlled. Prefer the headers
  // set by the platform edge, then the last (proxy-appended) hop.
  const forwarded = req.headers.get('x-forwarded-for')
  const lastHop = forwarded?.split(',').pop()?.trim()
  const ip =
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    lastHop ||
    'unknown'
  return `${prefix}:${ip}`
}

/**
 * Periodic cleanup to prevent unbounded memory growth. Called lazily from
 * rateLimit — O(n) every ~1000 checks when buckets get stale.
 */
let lastSweep = Date.now()
setInterval(() => {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k)
  }
}, 60_000).unref?.()
