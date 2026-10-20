/**
 * Payment provider abstraction for Easy Travel.
 *
 * Supports Orange Money (OM) and MTN Mobile Money (MOMO). In production, each
 * provider has its own REST/webhook flow, but they share the same lifecycle:
 *   1. initiate(amount, phone)  -> { reference, status: 'PENDING' }
 *   2. user confirms on phone via USSD
 *   3. provider posts a webhook with final status (or we poll)
 *
 * For dev/demo we ship a SimulatedProvider that auto-completes after 4s and
 * auto-fails if the phone ends with `000`. Swap in the real provider by setting
 * PAYMENT_PROVIDER=om|momo and filling in the corresponding credentials.
 */

import { FapshiError, directPay, fapshiConfigured, paymentStatus, toLifecycle } from './fapshi'

export type PaymentProviderId = 'OM' | 'MOMO'

/** Thrown when mobile money cannot be processed (no gateway configured in production). */
export class PaymentUnavailableError extends Error {
  constructor() {
    super("Le paiement Mobile Money n'est pas disponible pour le moment.")
    this.name = 'PaymentUnavailableError'
  }
}

export interface PaymentInitiateInput {
  amountCents: number
  currency: string
  phoneNumber: string
  reference: string
}

export interface PaymentProviderResult {
  externalRef: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
  failureReason?: string
}

export interface PaymentProvider {
  id: PaymentProviderId
  name: string
  prefixes: string[] // accepted Cameroonian mobile prefixes
  initiate(input: PaymentInitiateInput): Promise<PaymentProviderResult>
  getStatus(externalRef: string, initiatedAt: Date, phoneNumber: string): Promise<PaymentProviderResult>
}

const SIM_DELAY_MS = 4_000

function isSimulatedFailurePhone(phone: string): boolean {
  return phone.replace(/\s/g, '').endsWith('000')
}

/**
 * Simulated provider. Mimics real MoMo/OM latency and outcomes.
 * - Returns PENDING for the first SIM_DELAY_MS ms after initiation
 * - Returns SUCCEEDED after that, unless phone ends in `000` -> FAILED
 */
function buildSimulated(id: PaymentProviderId, name: string, prefixes: string[]): PaymentProvider {
  return {
    id,
    name,
    prefixes,
    async initiate(input) {
      return {
        externalRef: `SIM-${id}-${input.reference}-${Date.now()}`,
        status: 'PENDING',
      }
    },
    async getStatus(externalRef, initiatedAt, phoneNumber) {
      const elapsed = Date.now() - initiatedAt.getTime()
      if (elapsed < SIM_DELAY_MS) {
        return { externalRef, status: 'PENDING' }
      }
      if (isSimulatedFailurePhone(phoneNumber)) {
        return {
          externalRef,
          status: 'FAILED',
          failureReason: 'Paiement refusé par l\'opérateur (solde insuffisant ou délai dépassé).',
        }
      }
      return { externalRef, status: 'SUCCEEDED' }
    },
  }
}

const OrangeMoney = buildSimulated('OM', 'Orange Money', ['69', '65'])
const MtnMoMo = buildSimulated('MOMO', 'MTN Mobile Money', ['67', '68', '65'])

export const PROVIDERS: Record<PaymentProviderId, PaymentProvider> = {
  OM: OrangeMoney,
  MOMO: MtnMoMo,
}

/**
 * Real provider: Fapshi aggregator (MTN MoMo + Orange Money). `externalRef` is
 * the Fapshi transId, which the webhook and status polling use to find the payment.
 */
function buildFapshi(base: PaymentProvider): PaymentProvider {
  return {
    ...base,
    async initiate(input) {
      const { transId } = await directPay({
        amountXaf: input.amountCents,
        phone: input.phoneNumber,
        provider: base.id,
        externalId: input.reference,
      })
      return { externalRef: transId, status: 'PENDING' }
    },
    async getStatus(externalRef) {
      try {
        const tx = await paymentStatus(externalRef)
        const status = toLifecycle(tx.status)
        return {
          externalRef,
          status,
          failureReason:
            status === 'FAILED'
              ? tx.status === 'EXPIRED'
                ? 'Délai de confirmation dépassé.'
                : tx.reason || "Paiement refusé par l'opérateur (solde insuffisant ou annulé)."
              : undefined,
        }
      } catch (err) {
        // Status checks are rate limited (6/min per transaction) and the webhook is
        // the primary signal: treat throttling / transient errors as "still pending".
        if (err instanceof FapshiError && (err.status === 429 || err.status >= 500)) {
          return { externalRef, status: 'PENDING' }
        }
        throw err
      }
    },
  }
}

export function getProvider(id: PaymentProviderId): PaymentProvider {
  const sim = PROVIDERS[id]
  if (!sim) throw new Error(`Unknown payment provider: ${id}`)
  if (fapshiConfigured()) return buildFapshi(sim)
  // The simulator confirms every payment: never allow it on a production deployment
  // unless explicitly opted in (demo sites).
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SIMULATED_PAYMENTS !== 'true') {
    throw new PaymentUnavailableError()
  }
  return sim
}

/**
 * Normalize a Cameroonian phone number to `6XXXXXXXX` (9 digits, no spaces).
 * Accepts variants like `+237 6 55 12 34 56`, `237655123456`, `655 123 456`.
 * Returns null if the number is obviously invalid.
 */
export function normalizeCameroonPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const trimmed = digits.startsWith('237') ? digits.slice(3) : digits
  if (trimmed.length !== 9) return null
  if (!trimmed.startsWith('6')) return null
  return trimmed
}

export function detectProviderForPhone(phone: string): PaymentProviderId | null {
  const n = normalizeCameroonPhone(phone)
  if (!n) return null
  const prefix = n.slice(0, 2)
  // 69 / 655 = Orange historically; 67 / 68 / 65 = MTN. Simplified.
  if (['69'].includes(prefix)) return 'OM'
  if (['67', '68'].includes(prefix)) return 'MOMO'
  return null
}
