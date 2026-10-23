import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))
// defaultToolFees imports the Contentful client, which needs credentials at import time (absent in CI)
vi.mock('@/lib/contentful/toolConfigCache', () => ({ getCachedToolConfig: vi.fn() }))

import { discountServiceFeeSol, getMaxServiceFeeLamports, MAX_TOOL_BASE_FEE_SOL } from '../serviceFeeLimit'
import { DEFAULT_TOOL_BASE_FEES_SOL } from '../../server-side/defaultToolFees'

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
    expect(getMaxServiceFeeLamports({ toolId: 'token-creator', baseFeeSol: 0.01 })).toBe(BigInt(10_000_000))
  })

  it('should return the discounted fee for a 50% coupon', () => {
    const limit = getMaxServiceFeeLamports({ toolId: 'token-creator', baseFeeSol: 0.01, discountPercentage: 50 })
    expect(limit).toBeGreaterThanOrEqual(BigInt(5_000_000))
    expect(limit).toBeLessThanOrEqual(BigInt(5_000_001))
  })

  it('should allow zero lamports for a 100% coupon', () => {
    expect(getMaxServiceFeeLamports({ toolId: 'token-creator', baseFeeSol: 0.19, discountPercentage: 100 })).toBe(BigInt(0))
  })

  it('should keep add-on fees undiscounted', () => {
    expect(getMaxServiceFeeLamports({ toolId: 'token-creator', baseFeeSol: 0.19, discountPercentage: 100, addOnFeesSol: 0.05 })).toBe(
      BigInt(50_000_000)
    )
  })

  it('should scale the discounted per-unit fee by the unit count', () => {
    const limit = getMaxServiceFeeLamports({ toolId: 'token-creator', baseFeeSol: 0.01, discountPercentage: 50, units: 7 })
    expect(limit).toBeGreaterThanOrEqual(BigInt(35_000_000))
    expect(limit).toBeLessThanOrEqual(BigInt(35_000_001))
  })

  it('should round up to whole lamports and never fall below the server amount (floor of the same fee)', () => {
    // 33% off 0.009 SOL = 6_030_000 lamports exactly in theory; 7% off 0.000000013 SOL is fractional
    const fractional = getMaxServiceFeeLamports({ toolId: 'token-creator', baseFeeSol: 0.000000013, discountPercentage: 7 })
    expect(fractional).toBe(BigInt(13)) // 12.09 lamports -> 13

    for (const [base, pct] of [
      [0.009, 33],
      [0.1, 12.5],
      [0.19, 99.99],
      [0.05, 1],
    ] as const) {
      const serverLamports = Math.floor(discountServiceFeeSol(base, pct) * 1_000_000_000)
      expect(getMaxServiceFeeLamports({ toolId: 'token-creator', baseFeeSol: base, discountPercentage: pct })).toBeGreaterThanOrEqual(
        BigInt(serverLamports)
      )
    }
  })

  it('should return zero for a zero base fee', () => {
    expect(getMaxServiceFeeLamports({ toolId: 'token-creator', baseFeeSol: 0, discountPercentage: 10 })).toBe(BigInt(0))
  })
})

describe('getMaxServiceFeeLamports — absolute per-tool ceiling', () => {
  it('should leave headroom above every fee the server charges by default and cover every fee-charging tool', () => {
    expect(Object.keys(MAX_TOOL_BASE_FEE_SOL).sort()).toEqual(Object.keys(DEFAULT_TOOL_BASE_FEES_SOL).sort())
    for (const [toolId, defaultFee] of Object.entries(DEFAULT_TOOL_BASE_FEES_SOL)) {
      expect(MAX_TOOL_BASE_FEE_SOL[toolId as keyof typeof MAX_TOOL_BASE_FEE_SOL]).toBeGreaterThanOrEqual(defaultFee * 2)
    }
  })

  it('should accept the default fee of every tool and a fee exactly at its ceiling', () => {
    for (const [toolId, defaultFee] of Object.entries(DEFAULT_TOOL_BASE_FEES_SOL)) {
      expect(() => getMaxServiceFeeLamports({ toolId: toolId as keyof typeof MAX_TOOL_BASE_FEE_SOL, baseFeeSol: defaultFee })).not.toThrow()
    }
    expect(getMaxServiceFeeLamports({ toolId: 'burn-tokens', baseFeeSol: MAX_TOOL_BASE_FEE_SOL['burn-tokens'] })).toBe(BigInt(30_000_000))
  })

  it('should fail closed instead of clamping a served fee above the ceiling', () => {
    expect(() => getMaxServiceFeeLamports({ toolId: 'burn-tokens', baseFeeSol: 5 })).toThrow(
      'The burn-tokens service fee (5 SOL) is higher than this app allows (0.03 SOL), so nothing was sent to your wallet.'
    )
    expect(() => getMaxServiceFeeLamports({ toolId: 'burn-tokens', baseFeeSol: 0.0300001 })).toThrow(/higher than this app allows/)
  })

  it('should apply the ceiling to the undiscounted fee, before any coupon', () => {
    expect(() => getMaxServiceFeeLamports({ toolId: 'burn-tokens', baseFeeSol: 5, discountPercentage: 99 })).toThrow(
      /higher than this app allows/
    )
    expect(() =>
      getMaxServiceFeeLamports({ toolId: 'transaction-multisender', baseFeeSol: 0.01, discountPercentage: 100, units: 50 })
    ).toThrow(/higher than this app allows/)
  })

  it('should reject invalid served fees', () => {
    for (const baseFeeSol of [Number.NaN, Number.POSITIVE_INFINITY, -0.01]) {
      expect(() => getMaxServiceFeeLamports({ toolId: 'burn-tokens', baseFeeSol })).toThrow(/higher than this app allows/)
    }
  })

  it('should throw an AppError the hooks surface as a verification failure', () => {
    expect.assertions(1)
    try {
      getMaxServiceFeeLamports({ toolId: 'token-creator', baseFeeSol: 5 })
    } catch (error) {
      expect(error).toMatchObject({ code: 'TRANSACTION_VERIFICATION_FAILED' })
    }
  })
})
