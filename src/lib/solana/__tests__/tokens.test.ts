/**
 * Unit tests for src/lib/solana/tokens.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { fetchImage, safeJsonStringify, formatTokenAmount } from '../tokens'

// ─── safeJsonStringify ────────────────────────────────────────────────────────

describe('safeJsonStringify', () => {
  it('should stringifies a plain object correctly', () => {
    const obj = { key: 'value', num: 42 }
    expect(JSON.parse(safeJsonStringify(obj))).toEqual(obj)
  })

  it('should converts BigInt values to strings', () => {
    const obj = { amount: BigInt(1_000_000_000_000) }
    const result = safeJsonStringify(obj)
    expect(result).toBe('{"amount":"1000000000000"}')
  })

  it('should handles objects with mixed BigInt and regular values', () => {
    const obj = { name: 'token', supply: BigInt(500), decimals: 6 }
    const parsed = JSON.parse(safeJsonStringify(obj))
    expect(parsed.name).toBe('token')
    expect(parsed.supply).toBe('500')
    expect(parsed.decimals).toBe(6)
  })

  it('should handles arrays with BigInt values', () => {
    const arr = [BigInt(1), BigInt(2), BigInt(3)]
    const result = safeJsonStringify(arr)
    expect(result).toBe('["1","2","3"]')
  })

  it('should handles null', () => {
    expect(safeJsonStringify(null)).toBe('null')
  })

  it('should handles nested BigInt values', () => {
    const obj = { nested: { amount: BigInt(99) } }
    const parsed = JSON.parse(safeJsonStringify(obj))
    expect(parsed.nested.amount).toBe('99')
  })

  it('should handles BigInt zero', () => {
    const obj = { zero: BigInt(0) }
    const parsed = JSON.parse(safeJsonStringify(obj))
    expect(parsed.zero).toBe('0')
  })

  it('should handles plain string values', () => {
    expect(safeJsonStringify('hello')).toBe('"hello"')
  })

  it('should handles numbers that are not BigInt', () => {
    expect(safeJsonStringify(42)).toBe('42')
  })
})

// ─── fetchImage ────────────────────────────────────────────────────────────────

describe('fetchImage', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('should returns image URL from a successful response', async () => {
    const mockImageUrl = 'https://example.com/token-image.png'
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ image: mockImageUrl }),
    })

    const result = await fetchImage('https://example.com/metadata.json')
    expect(result).toBe(mockImageUrl)
  })

  it('should returns null when response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn(),
    })

    const result = await fetchImage('https://example.com/missing.json')
    expect(result).toBeNull()
  })

  it('should returns null when metadata has no image field', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ name: 'Token', description: 'A token' }),
    })

    const result = await fetchImage('https://example.com/metadata.json')
    expect(result).toBeNull()
  })

  it('should returns null when fetch throws (e.g. network error)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await fetchImage('https://example.com/metadata.json')
    expect(result).toBeNull()
  })

  it('should returns null when fetch is aborted (timeout)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }))

    const result = await fetchImage('https://example.com/slow.json')
    expect(result).toBeNull()
  })

  it('should passes the Accept: application/json header', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ image: 'https://example.com/img.png' }),
    })

    await fetchImage('https://example.com/metadata.json')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com/metadata.json',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
      })
    )
  })

  it('should returns null when json parsing throws', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    })

    const result = await fetchImage('https://example.com/bad.json')
    expect(result).toBeNull()
  })

  it('should returns null when image field is empty string', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ image: '' }),
    })

    const result = await fetchImage('https://example.com/metadata.json')
    // empty string is falsy, so metadata.image || null = null
    expect(result).toBeNull()
  })
})

// ─── formatTokenAmount ─────────────────────────────────────────────────────────

describe('formatTokenAmount', () => {
  it('should formats a whole number amount with correct decimals', () => {
    // 1000000 / 10^6 = 1.000000
    const result = formatTokenAmount(1_000_000, 6)
    expect(result).toBe('1.000000')
  })

  it('should formats fractional token amounts', () => {
    // 500000 / 10^6 = 0.500000
    expect(formatTokenAmount(500_000, 6)).toBe('0.500000')
  })

  it('should works with 0 decimals', () => {
    expect(formatTokenAmount(100, 0)).toBe('100')
  })

  it('should works with 9 decimals (SOL-like)', () => {
    // 1_000_000_000 / 10^9 = 1.000000000
    expect(formatTokenAmount(1_000_000_000, 9)).toBe('1.000000000')
  })

  it('should works with 2 decimals', () => {
    expect(formatTokenAmount(1050, 2)).toBe('10.50')
  })

  it('should returns 0 with all decimals when amount is 0', () => {
    expect(formatTokenAmount(0, 6)).toBe('0.000000')
  })

  it('should handles very small amounts', () => {
    // 1 / 10^9 with toFixed(9)
    expect(formatTokenAmount(1, 9)).toBe('0.000000001')
  })

  it('should works with 8 decimals', () => {
    // 100_000_000 / 10^8 = 1.00000000
    expect(formatTokenAmount(100_000_000, 8)).toBe('1.00000000')
  })
})
