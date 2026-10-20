'use client'

import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export interface TicketPdfPassenger {
  fullName: string
  idNumber?: string | null
  seat?: string | null
}

export interface TicketPdfLeg {
  id: string
  leg: 'OUTBOUND' | 'RETURN'
  seats: string[]
  qrCode: string
  agencyName: string
  from: string
  to: string
  fromCity: string
  toCity: string
  departureTime: string
  arrivalTime: string
  date: string
  passengers: TicketPdfPassenger[]
  reference?: string
  price?: number
  currency?: string
}

const BRAND = '#13ec5b'
const INK = '#0a1a10'
const MUTED = '#6b7280'
const LINE = '#e5e7eb'

/**
 * Build a Blob containing a PDF of the provided booking leg and trigger
 * a download in the browser.
 *
 * The layout is intentionally self-contained (no external fonts, no remote
 * images) so it works offline.
 */
export async function downloadTicketPdf(
  leg: TicketPdfLeg,
  locale: 'fr' | 'en' = 'fr',
): Promise<void> {
  const doc = await buildTicketPdf(leg, locale)
  const filename = `billet-${leg.leg === 'OUTBOUND' ? 'aller' : 'retour'}-${leg.fromCity.toLowerCase().replace(/\s+/g, '-')}-${leg.toCity.toLowerCase().replace(/\s+/g, '-')}.pdf`
  doc.save(filename)
}

export async function buildTicketPdf(
  leg: TicketPdfLeg,
  locale: 'fr' | 'en' = 'fr',
): Promise<jsPDF> {
  const t = (fr: string, en: string) => (locale === 'en' ? en : fr)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  const marginX = 18
  let y = 20

  // Header bar
  doc.setFillColor(BRAND)
  doc.roundedRect(marginX, y, pageW - marginX * 2, 16, 3, 3, 'F')
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Easy Travel', marginX + 6, y + 10)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    t('Billet électronique', 'Electronic ticket'),
    pageW - marginX - 6,
    y + 10,
    { align: 'right' },
  )
  y += 24

  // Agency + leg badge
  doc.setTextColor(INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(leg.agencyName, marginX, y)
  const badgeLabel =
    leg.leg === 'OUTBOUND' ? t('ALLER', 'OUTBOUND') : t('RETOUR', 'RETURN')
  const badgeW = doc.getTextWidth(badgeLabel) + 8
  doc.setFillColor(BRAND)
  doc.roundedRect(pageW - marginX - badgeW, y - 5, badgeW, 7, 2, 2, 'F')
  doc.setTextColor('#ffffff')
  doc.setFontSize(9)
  doc.text(badgeLabel, pageW - marginX - badgeW / 2, y, { align: 'center' })
  y += 10

  if (leg.reference) {
    doc.setTextColor(MUTED)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Ref : ${leg.reference.slice(0, 10).toUpperCase()}`, marginX, y)
    y += 6
  }

  // Divider
  doc.setDrawColor(LINE)
  doc.line(marginX, y, pageW - marginX, y)
  y += 8

  // Times + route
  doc.setTextColor(INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(leg.departureTime, marginX, y)
  doc.text(leg.arrivalTime, pageW - marginX, y, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED)
  doc.text(leg.fromCity, marginX, y + 6)
  doc.text(leg.toCity, pageW - marginX, y + 6, { align: 'right' })
  doc.setFontSize(9)
  doc.text(leg.from, marginX, y + 11, { maxWidth: 70 })
  doc.text(leg.to, pageW - marginX, y + 11, { align: 'right', maxWidth: 70 })

  // Bus pictogram between times
  doc.setDrawColor(BRAND)
  doc.setLineWidth(0.4)
  const midY = y - 4
  doc.line(marginX + 42, midY, pageW - marginX - 42, midY)
  doc.setFillColor(BRAND)
  doc.circle(pageW / 2, midY, 1.4, 'F')
  y += 22

  // Info grid
  doc.setTextColor(INK)
  doc.setDrawColor(LINE)
  doc.line(marginX, y, pageW - marginX, y)
  y += 6

  const labelFont = () => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
  }
  const valueFont = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(INK)
  }

  const col1 = marginX
  const col2 = marginX + 70
  labelFont()
  doc.text(t('DATE', 'DATE'), col1, y)
  valueFont()
  doc.text(formatDate(leg.date, locale), col1, y + 6)

  labelFont()
  doc.text(t('SIÈGES', 'SEATS'), col2, y)
  valueFont()
  doc.text(leg.seats.length ? leg.seats.join(', ') : '—', col2, y + 6)
  y += 14

  labelFont()
  doc.text(t('PASSAGERS', 'PASSENGERS'), col1, y)
  y += 6
  valueFont()
  doc.setFontSize(10)
  for (const p of leg.passengers) {
    const tag = p.seat ? ` (${p.seat})` : ''
    doc.text(`• ${p.fullName}${tag}`, col1, y, { maxWidth: pageW - marginX * 2 })
    y += 5.5
  }

  if (typeof leg.price === 'number' && leg.currency) {
    y += 2
    doc.setDrawColor(LINE)
    doc.line(marginX, y, pageW - marginX, y)
    y += 6
    labelFont()
    doc.text(t('MONTANT PAYÉ', 'AMOUNT PAID'), col1, y)
    y += 6
    valueFont()
    doc.setFontSize(14)
    doc.text(
      `${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR').format(leg.price)} ${leg.currency}`,
      col1,
      y,
    )
    y += 6
  }

  // QR code
  const qrSize = 60
  const qrDataUrl = await QRCode.toDataURL(leg.qrCode, {
    margin: 0,
    width: 512,
    errorCorrectionLevel: 'M',
    color: { dark: INK, light: '#ffffff' },
  })
  const qrX = (pageW - qrSize) / 2
  y += 4
  doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize)
  y += qrSize + 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(INK)
  doc.text(
    t("Scanner à l'embarquement", 'Scan at boarding'),
    pageW / 2,
    y,
    { align: 'center' },
  )
  y += 5

  doc.setFont('courier', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text(leg.qrCode, pageW / 2, y, { align: 'center' })
  y += 10

  // Footer
  doc.setDrawColor(LINE)
  doc.line(marginX, y, pageW - marginX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text(
    t(
      "Ce billet est nominatif. Présentez le QR code au chef de gare à l'embarquement.",
      'This ticket is personal. Please show the QR code to the station manager at boarding.',
    ),
    pageW / 2,
    y,
    { align: 'center', maxWidth: pageW - marginX * 2 },
  )

  return doc
}

function formatDate(iso: string, locale: 'fr' | 'en'): string {
  try {
    return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      timeZone: 'Africa/Douala',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
