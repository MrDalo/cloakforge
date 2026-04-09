/**
 * Unit tests for src/lib/solana/raydium/lotSizeHelper.ts
 */

import { describe, it, expect } from 'vitest'
import { calculateLotSizes } from '../lotSizeHelper'

describe('calculateLotSizes', () => {
  it('returns correct baseLotSize for 9 decimals and minOrderSize 1', () => {
    const { baseLotSize } = calculateLotSizes(9, 9, 0.01, 1)
    // baseLotSize = 10^9 * 1 = 1_000_000_000
    expect(baseLotSize).toBe(1_000_000_000)
  })

  it('returns correct quoteLotSize for 9 decimals, tickSize 0.01, minOrder 1', () => {
    const { quoteLotSize } = calculateLotSizes(9, 9, 0.01, 1)
    // quoteLotSize = 10^9 * 0.01 * 1 = 10_000_000
    expect(quoteLotSize).toBe(10_000_000)
  })

  it('uses default tickSize of 0.01 and minOrderSize of 1', () => {
    const withDefaults = calculateLotSizes(6, 6)
    const explicit = calculateLotSizes(6, 6, 0.01, 1)
    expect(withDefaults).toEqual(explicit)
  })

  it('scales baseLotSize with baseDecimals', () => {
    const { baseLotSize: base6 } = calculateLotSizes(6, 9, 0.01, 1)
    const { baseLotSize: base9 } = calculateLotSizes(9, 9, 0.01, 1)
    expect(base9).toBe(base6 * 1000)
  })

  it('scales quoteLotSize with quoteDecimals', () => {
    const { quoteLotSize: quote6 } = calculateLotSizes(9, 6, 0.01, 1)
    const { quoteLotSize: quote9 } = calculateLotSizes(9, 9, 0.01, 1)
    expect(quote9).toBe(quote6 * 1000)
  })

  it('scales baseLotSize with targetMinOrderSize', () => {
    const { baseLotSize: lot1 } = calculateLotSizes(6, 6, 0.01, 1)
    const { baseLotSize: lot10 } = calculateLotSizes(6, 6, 0.01, 10)
    expect(lot10).toBe(lot1 * 10)
  })

  it('scales quoteLotSize with targetTickSize', () => {
    const { quoteLotSize: q001 } = calculateLotSizes(6, 6, 0.01, 1)
    const { quoteLotSize: q01 } = calculateLotSizes(6, 6, 0.1, 1)
    expect(q01).toBe(q001 * 10)
  })

  it('floors baseLotSize to integer', () => {
    // Use values that would produce a fractional result
    const { baseLotSize } = calculateLotSizes(6, 6, 0.001, 0.001)
    expect(Number.isInteger(baseLotSize)).toBe(true)
  })

  it('floors quoteLotSize to integer', () => {
    const { quoteLotSize } = calculateLotSizes(6, 6, 0.001, 0.001)
    expect(Number.isInteger(quoteLotSize)).toBe(true)
  })

  it('returns both baseLotSize and quoteLotSize', () => {
    const result = calculateLotSizes(6, 6, 0.01, 1)
    expect(result).toHaveProperty('baseLotSize')
    expect(result).toHaveProperty('quoteLotSize')
  })

  it('throws when baseLotSize < 1', () => {
    // baseDecimals=0, minOrderSize very small => baseLotSize < 1
    expect(() => calculateLotSizes(0, 0, 0.001, 0.001)).toThrow('Lot sizes too small')
  })

  it('throws when quoteLotSize < 1', () => {
    // Very small tickSize and minOrderSize with low decimals
    expect(() => calculateLotSizes(0, 0, 0.0001, 1)).toThrow('Lot sizes too small')
  })

  it('works with USDC (6 decimals) and SOL (9 decimals)', () => {
    // Common case: USDC/SOL pool
    const { baseLotSize, quoteLotSize } = calculateLotSizes(6, 9, 0.001, 1)
    expect(baseLotSize).toBeGreaterThan(0)
    expect(quoteLotSize).toBeGreaterThan(0)
  })

  it('works with large minOrderSize', () => {
    const { baseLotSize } = calculateLotSizes(6, 6, 0.01, 1000)
    expect(baseLotSize).toBe(1_000_000 * 1000)
  })
})
