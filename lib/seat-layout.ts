// Seat layout model for vehicles.
// Rows are numbered 1..rows. Columns use letters (A,B,C,D,...).
// aisleAfterCol: aisle drawn after the Nth column (1-based). E.g. 2 for a 2-2 layout.
// vipRows: rows (1-based) that are VIP (higher price multiplier).
// disabledCells: seat ids that physically don't exist (e.g. driver, stairs).
// lastRowSeats: override last row to have N seats if bus has a back row of 5.

export type SeatLayout = {
  rows: number
  cols: number
  aisleAfterCol: number
  vipRows: number[]
  disabledCells: string[]
  label: string
  vipMultiplier: number // e.g. 1.3 for +30% for VIP seats
}

export const DEFAULT_VIP_MULTIPLIER = 1.3

export function defaultLayoutForCapacity(capacity: number, type: 'VIP' | 'CLASSIC' = 'CLASSIC'): SeatLayout {
  // 70-seat Marcopolo-style: 18 rows × 4 cols, last row 5.
  // 50-seat: 12 rows × 4 + 2 back.
  // 30-seat Coaster: 8 rows × 3 (1+2) + last 3.
  if (capacity <= 30) {
    return {
      rows: 10,
      cols: 3,
      aisleAfterCol: 1,
      vipRows: type === 'VIP' ? [1, 2] : [],
      disabledCells: ['1A'], // driver
      label: type === 'VIP' ? 'Coaster VIP' : 'Coaster Classique',
      vipMultiplier: DEFAULT_VIP_MULTIPLIER,
    }
  }
  if (capacity <= 50) {
    return {
      rows: 12,
      cols: 4,
      aisleAfterCol: 2,
      vipRows: type === 'VIP' ? [1, 2, 3] : [1],
      disabledCells: ['1A'],
      label: type === 'VIP' ? 'Autocar VIP' : 'Autocar Classique',
      vipMultiplier: DEFAULT_VIP_MULTIPLIER,
    }
  }
  return {
    rows: 15,
    cols: 4,
    aisleAfterCol: 2,
    vipRows: type === 'VIP' ? [1, 2, 3, 4] : [1],
    disabledCells: ['1A'],
    label: type === 'VIP' ? 'Autocar Grand VIP' : 'Autocar Grande Capacité',
    vipMultiplier: DEFAULT_VIP_MULTIPLIER,
  }
}

export function colLetter(i: number): string {
  // 0 -> A, 1 -> B ...
  return String.fromCharCode(65 + i)
}

export function seatId(row: number, col: number): string {
  return `${row}${colLetter(col)}`
}

export function allSeatIds(layout: SeatLayout): string[] {
  const out: string[] = []
  for (let r = 1; r <= layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const id = seatId(r, c)
      if (!layout.disabledCells.includes(id)) out.push(id)
    }
  }
  return out
}

export function isVipSeat(layout: SeatLayout, id: string): boolean {
  const m = /^(\d+)[A-Z]$/.exec(id)
  if (!m) return false
  const row = Number(m[1])
  return layout.vipRows.includes(row)
}

export function computeSeatPriceCents(baseCents: number, layout: SeatLayout, id: string): number {
  if (isVipSeat(layout, id)) return Math.round(baseCents * layout.vipMultiplier)
  return baseCents
}

export function totalAvailableSeats(layout: SeatLayout): number {
  return allSeatIds(layout).length
}
