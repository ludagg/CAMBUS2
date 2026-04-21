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

export type PaymentProviderId = 'OM' | 'MOMO'

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

export function getProvider(id: PaymentProviderId): PaymentProvider {
  const p = PROVIDERS[id]
  if (!p) throw new Error(`Unknown payment provider: ${id}`)
  return p
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
