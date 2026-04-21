/**
 * Notifications abstraction — email + SMS.
 *
 * Two providers behind the same interface:
 *   - MockProvider: logs to console. Default when no credentials are set.
 *   - ResendProvider / TwilioProvider: activated when env vars are present.
 *
 * This keeps the rest of the app (payment success hook, manual resend button)
 * agnostic. In tests we inject MockProvider directly.
 */

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

export interface SmsMessage {
  to: string // E.164 format, +237XXXXXXXXX
  body: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string }>
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<{ id: string }>
}

class MockEmailProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.log('[email:mock]', {
      to: message.to,
      subject: message.subject,
      preview: message.text?.slice(0, 120) ?? message.html.slice(0, 120),
    })
    return { id: `mock-email-${Date.now()}` }
  }
}

class ResendEmailProvider implements EmailProvider {
  constructor(
    private apiKey: string,
    private from: string,
  ) {}

  async send(message: EmailMessage) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend failed: ${res.status} ${body}`)
    }
    const data = (await res.json()) as { id: string }
    return { id: data.id }
  }
}

class MockSmsProvider implements SmsProvider {
  async send(message: SmsMessage) {
    console.log('[sms:mock]', { to: message.to, body: message.body })
    return { id: `mock-sms-${Date.now()}` }
  }
}

class TwilioSmsProvider implements SmsProvider {
  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumber: string,
  ) {}

  async send(message: SmsMessage) {
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.fromNumber,
          To: message.to,
          Body: message.body,
        }),
      },
    )
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Twilio failed: ${res.status} ${body}`)
    }
    const data = (await res.json()) as { sid: string }
    return { id: data.sid }
  }
}

let emailProviderCache: EmailProvider | null = null
let smsProviderCache: SmsProvider | null = null

export function getEmailProvider(): EmailProvider {
  if (emailProviderCache) return emailProviderCache
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'Easy Travel <noreply@easytravel.cm>'
  emailProviderCache = key ? new ResendEmailProvider(key, from) : new MockEmailProvider()
  return emailProviderCache
}

export function getSmsProvider(): SmsProvider {
  if (smsProviderCache) return smsProviderCache
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  smsProviderCache = sid && token && from
    ? new TwilioSmsProvider(sid, token, from)
    : new MockSmsProvider()
  return smsProviderCache
}

/**
 * Format a Cameroonian phone number for SMS (E.164).
 */
export function toE164Cameroon(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('237')) return `+${digits}`
  if (digits.length === 9) return `+237${digits}`
  return `+${digits}`
}

/**
 * Render booking confirmation email. HTML + plain-text version.
 */
export function renderBookingEmail(params: {
  contactName: string
  bookings: Array<{
    from: string
    to: string
    date: string
    departureTime: string
    seats: string[]
    qrCode: string
    leg: 'OUTBOUND' | 'RETURN'
  }>
  totalCents: number
  currency: string
  publicBaseUrl: string
}): { subject: string; html: string; text: string } {
  const { contactName, bookings, totalCents, currency, publicBaseUrl } = params
  const fmtPrice = new Intl.NumberFormat('fr-FR').format(totalCents)
  const subject = bookings.length === 1
    ? `Billet confirmé — ${bookings[0].from} → ${bookings[0].to}`
    : `Billets confirmés — ${bookings[0].from} ↔ ${bookings[bookings.length - 1].to}`
  const rows = bookings
    .map(
      (b) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;">
            <div style="font-weight:700;">${b.leg === 'OUTBOUND' ? 'Aller' : 'Retour'} — ${b.from} → ${b.to}</div>
            <div style="color:#555;">${b.date} à ${b.departureTime}</div>
            <div style="color:#13ec5b;font-weight:700;">Sièges : ${b.seats.length ? b.seats.join(', ') : 'À confirmer en agence'}</div>
            <div style="margin-top:6px;"><a href="${publicBaseUrl}/bookings" style="color:#0a70dc;">Afficher le QR code ↗</a></div>
          </td>
        </tr>`,
    )
    .join('')
  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h1 style="color:#13ec5b;">Easy Travel</h1>
      <p>Bonjour ${contactName},</p>
      <p>Votre paiement a bien été reçu. Voici le détail de votre réservation :</p>
      <table style="width:100%;">${rows}</table>
      <p style="font-weight:700;font-size:18px;margin-top:16px;">Total payé : ${fmtPrice} ${currency}</p>
      <p style="color:#555;">Présentez le QR code sur votre billet à l'embarquement. Bon voyage !</p>
    </div>`
  const text = bookings
    .map(
      (b) =>
        `${b.leg === 'OUTBOUND' ? 'Aller' : 'Retour'}: ${b.from} → ${b.to} le ${b.date} à ${b.departureTime}. Sièges: ${b.seats.join(', ') || 'à confirmer'}.`,
    )
    .concat([`Total: ${fmtPrice} ${currency}. Billet: ${publicBaseUrl}/bookings`])
    .join('\n')
  return { subject, html, text }
}

export function renderBookingSms(params: {
  fromCity: string
  toCity: string
  departureAt: string
  seats: string[]
  publicBaseUrl: string
}): string {
  const seatsStr = params.seats.length ? ` (sièges ${params.seats.join(',')})` : ''
  return `Easy Travel: billet confirmé ${params.fromCity}->${params.toCity} ${params.departureAt}${seatsStr}. QR: ${params.publicBaseUrl}/bookings`
}
