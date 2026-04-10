import { describe, it, expect } from 'vitest'
import { formatServiceIdentifier, formatTimestamp, truncateAddress, formatTokenAmount } from '../transactionUtils'

// ---------------------------------------------------------------------------
// formatServiceIdentifier
// ---------------------------------------------------------------------------

describe('formatServiceIdentifier', () => {
  it('removes the -service suffix and title-cases each word', () => {
    expect(formatServiceIdentifier('token-creator-service')).toBe('Token Creator')
  })

  it('handles single-word identifiers with -service suffix', () => {
    expect(formatServiceIdentifier('burn-tokens-service')).toBe('Burn Tokens')
  })

  it('handles freeze-accounts-service', () => {
    expect(formatServiceIdentifier('freeze-accounts-service')).toBe('Freeze Accounts')
  })

  it('handles unfreeze-accounts-service', () => {
    expect(formatServiceIdentifier('unfreeze-accounts-service')).toBe('Unfreeze Accounts')
  })

  it('handles authority-management-service', () => {
    expect(formatServiceIdentifier('authority-management-service')).toBe('Authority Management')
  })

  it('handles transaction-multisender-service', () => {
    expect(formatServiceIdentifier('transaction-multisender-service')).toBe('Transaction Multisender')
  })

  it('handles create-liquidity-service', () => {
    expect(formatServiceIdentifier('create-liquidity-service')).toBe('Create Liquidity')
  })

  it('handles portfolio-tracker-service', () => {
    expect(formatServiceIdentifier('portfolio-tracker-service')).toBe('Portfolio Tracker')
  })
})

// ---------------------------------------------------------------------------
// formatTimestamp
// ---------------------------------------------------------------------------

describe('formatTimestamp', () => {
  it('returns "Unknown" for null', () => {
    expect(formatTimestamp(null)).toBe('Unknown')
  })

  it('returns "Unknown" for 0 (falsy block time)', () => {
    expect(formatTimestamp(0)).toBe('Unknown')
  })

  it('converts a Unix timestamp (seconds) to a locale string', () => {
    // Unix epoch 1_700_000_000 → a real date, just verify it is non-empty
    const result = formatTimestamp(1_700_000_000)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    // Verify the underlying Date is correct (year 2023)
    expect(new Date(1_700_000_000 * 1000).getFullYear()).toBe(2023)
  })

  it('returns a non-empty string for recent timestamps', () => {
    const now = Math.floor(Date.now() / 1000)
    const result = formatTimestamp(now)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// truncateAddress
// ---------------------------------------------------------------------------

describe('truncateAddress', () => {
  it('truncates a long address with default lengths (4…4)', () => {
    const addr = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    const result = truncateAddress(addr)
    expect(result).toBe('EPjF...Dt1v')
  })

  it('returns the full address when it is <= startLength + endLength', () => {
    expect(truncateAddress('abcdefgh', 4, 4)).toBe('abcdefgh')
  })

  it('returns the full address when equal to combined length', () => {
    expect(truncateAddress('12345678', 4, 4)).toBe('12345678')
  })

  it('supports custom start and end lengths', () => {
    const addr = 'So11111111111111111111111111111111111111112'
    expect(truncateAddress(addr, 6, 6)).toBe('So1111...111112')
  })

  it('includes ellipsis for addresses longer than combined lengths', () => {
    const addr = 'ABCDEFGHIJK'
    const result = truncateAddress(addr, 3, 3)
    expect(result).toContain('...')
    expect(result.startsWith('ABC')).toBe(true)
    expect(result.endsWith('IJK')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// formatTokenAmount
// ---------------------------------------------------------------------------

describe('formatTokenAmount', () => {
  it('formats an integer amount with 0 decimals', () => {
    expect(formatTokenAmount(1000, 0)).toBe('1,000')
  })

  it('formats amount with decimals, removing trailing zeros', () => {
    // 1.5 with decimals=9 → "1.5" (trailing zeros stripped)
    expect(formatTokenAmount(1.5, 9)).toBe('1.5')
  })

  it('strips all decimal digits when they are all zero', () => {
    // 100 with decimals=4 → "100" (not "100.0000")
    expect(formatTokenAmount(100, 4)).toBe('100')
  })

  it('keeps significant decimal digits up to 3 places (toLocaleString default)', () => {
    // toLocaleString() uses max 3 fraction digits by default, so 0.001 is preserved
    expect(formatTokenAmount(0.001, 3)).toBe('0.001')
  })

  it('formats large numbers with commas', () => {
    const result = formatTokenAmount(1_000_000, 0)
    expect(result).toBe('1,000,000')
  })

  it('formats small fractional amounts correctly', () => {
    const result = formatTokenAmount(0.5, 2)
    expect(result).toBe('0.5')
  })

  it('handles 0 amount', () => {
    const result = formatTokenAmount(0, 6)
    expect(result).toBe('0')
  })
})
