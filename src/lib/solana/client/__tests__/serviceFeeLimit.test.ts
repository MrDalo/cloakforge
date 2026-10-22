import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { discountServiceFeeSol, getMaxServiceFeeLamports } from '../serviceFeeLimit'

describe('discountServiceFeeSol', () => {
  it('should return the base fee without a coupon', () => {
    expect(discountServiceFeeSol(0.01)).toBe(0.01)
    expect(discountServiceFeeSol(0.01, 0)).toBe(0.01)
  })

  it('should apply the percentage discount', () => {
    expect(discountServiceFeeSol(0.01, 50)).toBeCloseTo(0.005, 12)
  })

  it('should return zero for a 100% coupon', () => {
    expect(discountServiceFeeSol(0.19, 100)).toBe(0)
  })

  it('should clamp out-of-range and non-finite percentages like the server', () => {
    expect(discountServiceFeeSol(0.01, 150)).toBe(0)
    expect(discountServiceFeeSol(0.01, -20)).toBe(0.01)
    expect(discountServiceFeeSol(0.01, Number.NaN)).toBe(0.01)
  })
})

describe('getMaxServiceFeeLamports', () => {
  it('should return the full fee in lamports without a coupon', () => {
    expect(getMaxServiceFeeLamports({ baseFeeSol: 0.01 })).toBe(BigInt(10_000_000))
  })

  it('should return the discounted fee for a 50% coupon', () => {
    const limit = getMaxServiceFeeLamports({ baseFeeSol: 0.01, discountPercentage: 50 })
    expect(limit).toBeGreaterThanOrEqual(BigInt(5_000_000))
    expect(limit).toBeLessThanOrEqual(BigInt(5_000_001))
  })

  it('should allow zero lamports for a 100% coupon', () => {
    expect(getMaxServiceFeeLamports({ baseFeeSol: 0.19, discountPercentage: 100 })).toBe(BigInt(0))
  })

  it('should keep add-on fees undiscounted', () => {
    expect(getMaxServiceFeeLamports({ baseFeeSol: 0.19, discountPercentage: 100, addOnFeesSol: 0.05 })).toBe(BigInt(50_000_000))
  })

  it('should scale the discounted per-unit fee by the unit count', () => {
    const limit = getMaxServiceFeeLamports({ baseFeeSol: 0.01, discountPercentage: 50, units: 7 })
    expect(limit).toBeGreaterThanOrEqual(BigInt(35_000_000))
    expect(limit).toBeLessThanOrEqual(BigInt(35_000_001))
  })

  it('should round up to whole lamports and never fall below the server amount (floor of the same fee)', () => {
    // 33% off 0.009 SOL = 6_030_000 lamports exactly in theory; 7% off 0.000000013 SOL is fractional
    const fractional = getMaxServiceFeeLamports({ baseFeeSol: 0.000000013, discountPercentage: 7 })
    expect(fractional).toBe(BigInt(13)) // 12.09 lamports -> 13

    for (const [base, pct] of [
      [0.009, 33],
      [0.1, 12.5],
      [0.19, 99.99],
      [0.05, 1],
    ] as const) {
      const serverLamports = Math.floor(discountServiceFeeSol(base, pct) * 1_000_000_000)
      expect(getMaxServiceFeeLamports({ baseFeeSol: base, discountPercentage: pct })).toBeGreaterThanOrEqual(BigInt(serverLamports))
    }
  })

  it('should return zero for a zero base fee', () => {
    expect(getMaxServiceFeeLamports({ baseFeeSol: 0, discountPercentage: 10 })).toBe(BigInt(0))
  })
})
