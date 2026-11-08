import { describe, it, expect } from 'vitest'
import { parseTokenAmount, toDecimalAmountString, formatRawTokenAmount, U64_MAX } from '../tokenAmount'

describe('parseTokenAmount', () => {
  it.each<[number | string, number, bigint]>([
    ['1.000001', 6, BigInt(1_000_001)],
    [1.000001, 6, BigInt(1_000_001)],
    ['0.5', 9, BigInt(500_000_000)],
    [0.1, 9, BigInt(100_000_000)],
    [0.3, 6, BigInt(300_000)],
    ['3', 0, BigInt(3)],
    [3, 0, BigInt(3)],
    ['1.500000000', 6, BigInt(1_500_000)], // trailing zeros beyond the mint decimals are fine
    ['  2.25 ', 2, BigInt(225)],
    [1e-7, 9, BigInt(100)], // String(1e-7) is exponent notation
  ])('should convert %s with %i decimals exactly', (amount, decimals, expected) => {
    expect(parseTokenAmount(amount, decimals)).toBe(expected)
  })

  it('should not drift like float scaling (Math.round(x * 10 ** d))', () => {
    // 1.005 * 1000 and 4.35 * 100 are not exact in floating point
    expect(parseTokenAmount('1.005', 3)).toBe(BigInt(1005))
    expect(parseTokenAmount(4.35, 2)).toBe(BigInt(435))
    expect(parseTokenAmount('123456789.123456789', 9)).toBe(BigInt('123456789123456789'))
  })

  it('should reject more fractional digits than the mint decimals', () => {
    expect(() => parseTokenAmount('1.0000001', 6)).toThrow(expect.objectContaining({ code: 'INVALID_AMOUNT' }))
    expect(() => parseTokenAmount(0.5, 0)).toThrow(/whole number/)
  })

  it('should accept u64::MAX and reject anything above it', () => {
    expect(parseTokenAmount('18446744073709551615', 0)).toBe(U64_MAX)
    expect(() => parseTokenAmount('18446744073709551616', 0)).toThrow(expect.objectContaining({ code: 'AMOUNT_TOO_LARGE' }))
    expect(() => parseTokenAmount('18446744073.709551616', 9)).toThrow(expect.objectContaining({ code: 'AMOUNT_TOO_LARGE' }))
  })

  it.each<number | string>([0, '0', '0.000', -1, '-1', 'abc', '', '1e5', '.5', '1.', '0x10', Number.NaN, Number.POSITIVE_INFINITY])(
    'should reject invalid or non-positive amount %s',
    (amount) => {
      expect(() => parseTokenAmount(amount, 6)).toThrow(expect.objectContaining({ code: 'INVALID_AMOUNT' }))
    }
  )

  it('should reject numbers beyond the safe integer range (precision already lost)', () => {
    expect(() => parseTokenAmount(Number.MAX_SAFE_INTEGER + 2, 0)).toThrow(expect.objectContaining({ code: 'AMOUNT_TOO_LARGE' }))
  })

  it.each([-1, 1.5, 256])('should reject invalid decimals %s', (decimals) => {
    expect(() => parseTokenAmount('1', decimals)).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
  })
})

describe('toDecimalAmountString', () => {
  it.each<[number, string]>([
    [1e-7, '0.0000001'],
    [1.5e-8, '0.000000015'],
    [123.45, '123.45'],
  ])('should expand %s to plain decimal notation', (value, expected) => {
    expect(toDecimalAmountString(value)).toBe(expected)
  })

  it('should pass decimal strings through trimmed', () => {
    expect(toDecimalAmountString(' 1.000001 ')).toBe('1.000001')
  })
})

describe('formatRawTokenAmount', () => {
  it.each<[bigint, number, string]>([
    [BigInt(1_000_001), 6, '1.000001'],
    [BigInt(500_000_000), 9, '0.5'],
    [BigInt(3), 0, '3'],
    [BigInt(1), 9, '0.000000001'],
    [BigInt(1_000_000), 6, '1'],
  ])('should format %s with %i decimals as %s', (raw, decimals, expected) => {
    expect(formatRawTokenAmount(raw, decimals)).toBe(expected)
  })
})
