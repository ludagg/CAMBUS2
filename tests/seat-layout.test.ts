import { describe, it, expect } from 'vitest'
import {
  computeSeatPriceCents,
  defaultLayoutForCapacity,
  isVipSeat,
  totalAvailableSeats,
} from '../lib/seat-layout'

describe('seat-layout pricing', () => {
  it('applies VIP multiplier to VIP rows', () => {
    const layout = defaultLayoutForCapacity(50, 'VIP')
    // VIP rows for 50-seat VIP layout are [1, 2, 3]
    expect(isVipSeat(layout, '1B')).toBe(true)
    expect(isVipSeat(layout, '2C')).toBe(true)
    expect(isVipSeat(layout, '5B')).toBe(false)
    expect(computeSeatPriceCents(10_000, layout, '1B')).toBe(13_000)
    expect(computeSeatPriceCents(10_000, layout, '5B')).toBe(10_000)
  })

  it('keeps classique prices at base', () => {
    const layout = defaultLayoutForCapacity(30, 'CLASSIC')
    expect(isVipSeat(layout, '5B')).toBe(false)
    expect(computeSeatPriceCents(7_500, layout, '5B')).toBe(7_500)
  })

  it('excludes disabled cells from availability', () => {
    const layout = defaultLayoutForCapacity(30)
    // 10 rows × 3 cols = 30, minus driver seat 1A
    expect(totalAvailableSeats(layout)).toBe(29)
  })
})
