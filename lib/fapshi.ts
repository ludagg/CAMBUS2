/**
 * Fapshi (https://fapshi.com) mobile money aggregator: MTN MoMo + Orange Money.
 * Docs: https://docs.fapshi.com/en/api-reference
 *
 * Flow used here ("direct pay"):
 *   1. POST /direct-pay   -> push a payment prompt to the customer's phone, get a transId
 *   2. customer confirms on the phone (USSD)
 *   3. Fapshi POSTs the webhook (/api/webhooks/fapshi) and/or we GET /payment-status/{transId}
 *
 * Environment:
 *   FAPSHI_API_USER / FAPSHI_API_KEY   credentials of the Fapshi service (per environment)
 *   FAPSHI_ENV                         "sandbox" (default) or "live"
 *   FAPSHI_WEBHOOK_SECRET              value of the secret set on the Fapshi dashboard;
 *                                      Fapshi echoes it in the x-wh-secret header
 *
 * Amounts: XAF has no minor unit, so `amountCents` is already the XAF amount.
 */

export type FapshiMedium = 'mobile money' | 'orange money'
export type FapshiStatus = 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'

export interface FapshiTransaction {
  transId: string
  status: FapshiStatus
  medium?: string
  amount?: number
  externalId?: string
  financialTransId?: string
  reason?: string
  dateInitiated?: string
  dateConfirmed?: string
}

export class FapshiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'FapshiError'
  }
}

const BASES = {
  sandbox: 'https://sandbox.fapshi.com',
  live: 'https://live.fapshi.com',
} as const

export const MIN_AMOUNT_XAF = 100

export function fapshiConfigured(): boolean {
  return Boolean(process.env.FAPSHI_API_USER && process.env.FAPSHI_API_KEY)
}

export function fapshiEnvironment(): 'sandbox' | 'live' {
  return process.env.FAPSHI_ENV === 'live' ? 'live' : 'sandbox'
}

function credentials() {
  const apiuser = process.env.FAPSHI_API_USER
  const apikey = process.env.FAPSHI_API_KEY
  if (!apiuser || !apikey) throw new FapshiError('Fapshi non configuré.', 503)
  return { apiuser, apikey }
}

async function call<T>(path: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<T> {
  const res = await fetch(`${BASES[fapshiEnvironment()]}${path}`, {
    method: init.method,
    headers: {
      'Content-Type': 'application/json',
      ...credentials(),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) {
    throw new FapshiError(json.message || `Fapshi a répondu ${res.status}.`, res.status)
  }
  return json as T
}

export function mediumFor(provider: 'MOMO' | 'OM'): FapshiMedium {
  return provider === 'OM' ? 'orange money' : 'mobile money'
}

/** Ask Fapshi to push a payment prompt to the customer's phone. */
export async function directPay(input: {
  amountXaf: number
  phone: string // 9 digits, 6XXXXXXXX
  provider: 'MOMO' | 'OM'
  externalId: string // our BookingGroup id (letters, digits, - _ only)
  email?: string
  name?: string
  message?: string
}): Promise<{ transId: string }> {
  if (!Number.isInteger(input.amountXaf) || input.amountXaf < MIN_AMOUNT_XAF) {
    throw new FapshiError(`Montant minimum: ${MIN_AMOUNT_XAF} FCFA.`, 400)
  }
  const out = await call<{ transId?: string; message?: string }>('/direct-pay', {
    method: 'POST',
    body: {
      amount: input.amountXaf,
      phone: input.phone,
      medium: mediumFor(input.provider),
      externalId: input.externalId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 100),
      email: input.email,
      name: input.name,
      message: input.message ?? 'Billet Easy Travel',
    },
  })
  if (!out.transId) throw new FapshiError(out.message || 'Réponse Fapshi invalide.', 502)
  return { transId: out.transId }
}

export async function paymentStatus(transId: string): Promise<FapshiTransaction> {
  return call<FapshiTransaction>(`/payment-status/${encodeURIComponent(transId)}`, { method: 'GET' })
}

/** Map a Fapshi status onto our payment lifecycle. */
export function toLifecycle(status: FapshiStatus | string): 'PENDING' | 'SUCCEEDED' | 'FAILED' {
  if (status === 'SUCCESSFUL') return 'SUCCEEDED'
  if (status === 'FAILED' || status === 'EXPIRED') return 'FAILED'
  return 'PENDING'
}
