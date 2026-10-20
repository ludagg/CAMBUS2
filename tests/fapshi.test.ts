import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { directPay, fapshiConfigured, mediumFor, paymentStatus, toLifecycle, FapshiError } from '../lib/fapshi'
import { getProvider, PaymentUnavailableError } from '../lib/payment'

const ENV_KEYS = ['FAPSHI_API_USER', 'FAPSHI_API_KEY', 'FAPSHI_ENV', 'ALLOW_SIMULATED_PAYMENTS', 'NODE_ENV'] as const
let saved: Record<string, string | undefined>

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]))
  process.env.FAPSHI_API_USER = 'user'
  process.env.FAPSHI_API_KEY = 'key'
  delete process.env.FAPSHI_ENV
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else (process.env as Record<string, string>)[k] = saved[k]!
  }
  vi.unstubAllGlobals()
})

function mockFetch(status: number, json: unknown) {
  const fn = vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => json })
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('fapshi client', () => {
  it('is configured only with both credentials', () => {
    expect(fapshiConfigured()).toBe(true)
    delete process.env.FAPSHI_API_KEY
    expect(fapshiConfigured()).toBe(false)
  })

  it('maps providers to Fapshi mediums', () => {
    expect(mediumFor('MOMO')).toBe('mobile money')
    expect(mediumFor('OM')).toBe('orange money')
  })

  it('posts direct-pay to the sandbox by default with credentials in headers', async () => {
    const f = mockFetch(200, { transId: 'T123', message: 'ok' })
    const out = await directPay({ amountXaf: 6500, phone: '670000000', provider: 'MOMO', externalId: 'cmabc 123!' })
    expect(out.transId).toBe('T123')
    const [url, init] = f.mock.calls[0]
    expect(url).toBe('https://sandbox.fapshi.com/direct-pay')
    expect(init.headers.apiuser).toBe('user')
    expect(init.headers.apikey).toBe('key')
    const body = JSON.parse(init.body)
    expect(body).toMatchObject({ amount: 6500, phone: '670000000', medium: 'mobile money', externalId: 'cmabc123' })
  })

  it('uses the live URL only when FAPSHI_ENV=live', async () => {
    process.env.FAPSHI_ENV = 'live'
    const f = mockFetch(200, { transId: 'T1' })
    await directPay({ amountXaf: 500, phone: '690000000', provider: 'OM', externalId: 'g1' })
    expect(f.mock.calls[0][0]).toBe('https://live.fapshi.com/direct-pay')
  })

  it('rejects amounts under the minimum without calling Fapshi', async () => {
    const f = mockFetch(200, {})
    await expect(directPay({ amountXaf: 50, phone: '670000000', provider: 'MOMO', externalId: 'g' })).rejects.toBeInstanceOf(FapshiError)
    expect(f).not.toHaveBeenCalled()
  })

  it('surfaces Fapshi error messages', async () => {
    mockFetch(400, { message: 'Invalid phone' })
    await expect(directPay({ amountXaf: 500, phone: '1', provider: 'MOMO', externalId: 'g' })).rejects.toThrow('Invalid phone')
  })

  it('maps statuses to our lifecycle', () => {
    expect(toLifecycle('SUCCESSFUL')).toBe('SUCCEEDED')
    expect(toLifecycle('FAILED')).toBe('FAILED')
    expect(toLifecycle('EXPIRED')).toBe('FAILED')
    expect(toLifecycle('PENDING')).toBe('PENDING')
    expect(toLifecycle('CREATED')).toBe('PENDING')
  })

  it('reads payment status', async () => {
    mockFetch(200, { transId: 'T1', status: 'SUCCESSFUL' })
    expect((await paymentStatus('T1')).status).toBe('SUCCESSFUL')
  })
})

describe('getProvider with Fapshi', () => {
  it('treats a 429 on status polling as still pending', async () => {
    mockFetch(429, { message: 'Too many requests' })
    const r = await getProvider('MOMO').getStatus('T1', new Date(), '670000000')
    expect(r.status).toBe('PENDING')
  })

  it('reports a failed payment with a reason', async () => {
    mockFetch(200, { transId: 'T1', status: 'FAILED' })
    const r = await getProvider('OM').getStatus('T1', new Date(), '690000001')
    expect(r.status).toBe('FAILED')
    expect(r.failureReason).toBeTruthy()
  })
})

describe('simulator guard', () => {
  it('refuses simulated mobile money in production without a gateway', () => {
    delete process.env.FAPSHI_API_USER
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    delete process.env.ALLOW_SIMULATED_PAYMENTS
    expect(() => getProvider('MOMO')).toThrow(PaymentUnavailableError)
  })

  it('allows the simulator when explicitly opted in', () => {
    delete process.env.FAPSHI_API_USER
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    process.env.ALLOW_SIMULATED_PAYMENTS = 'true'
    expect(getProvider('MOMO').id).toBe('MOMO')
  })
})
