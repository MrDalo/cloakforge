import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatNumber, formatCurrency, copyAddress } from '../walletUtils'

// ---------------------------------------------------------------------------
// formatNumber
// ---------------------------------------------------------------------------

describe('formatNumber', () => {
  it('should formats numbers >= 1 billion with B suffix', () => {
    expect(formatNumber(1_000_000_000)).toBe('1.00B')
  })

  it('should formats numbers >= 1 million with M suffix', () => {
    expect(formatNumber(1_500_000)).toBe('1.50M')
  })

  it('should formats numbers >= 1 thousand with K suffix', () => {
    expect(formatNumber(2_500)).toBe('2.50K')
  })

  it('should formats numbers below 1000 as plain decimal', () => {
    expect(formatNumber(42.5)).toBe('42.50')
  })

  it('should respects custom decimal places', () => {
    expect(formatNumber(1_000_000, 0)).toBe('1M')
    expect(formatNumber(1_500, 1)).toBe('1.5K')
  })

  it('should formats 0 correctly', () => {
    expect(formatNumber(0)).toBe('0.00')
  })

  it('should rounds to specified decimals', () => {
    expect(formatNumber(1_234_567, 2)).toBe('1.23M')
  })

  it('should formats exactly 1 billion', () => {
    expect(formatNumber(1e9, 2)).toBe('1.00B')
  })

  it('should formats exactly 1 million', () => {
    expect(formatNumber(1e6, 2)).toBe('1.00M')
  })

  it('should formats exactly 1 thousand', () => {
    expect(formatNumber(1000, 2)).toBe('1.00K')
  })

  it('should formats 999.99 as plain decimal (below 1K threshold)', () => {
    expect(formatNumber(999.99, 2)).toBe('999.99')
  })
})

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe('formatCurrency', () => {
  it('should formats positive numbers as USD currency', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('1,000')
    expect(result).toContain('$')
  })

  it('should formats zero as $0.00', () => {
    const result = formatCurrency(0)
    expect(result).toBe('$0.00')
  })

  it('should formats decimal values correctly', () => {
    const result = formatCurrency(1.5)
    expect(result).toBe('$1.50')
  })

  it('should formats large values with commas', () => {
    const result = formatCurrency(1_000_000)
    expect(result).toContain('1,000,000')
    expect(result).toContain('$')
  })

  it('should formats negative values', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
    expect(result).toContain('$')
  })
})

// ---------------------------------------------------------------------------
// copyAddress
// ---------------------------------------------------------------------------

describe('copyAddress', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  it('should calls navigator.clipboard.writeText with the address', () => {
    const address = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    copyAddress(address)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(address)
  })

  it('should calls writeText exactly once', () => {
    copyAddress('SomeAddress123')
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
  })
})
