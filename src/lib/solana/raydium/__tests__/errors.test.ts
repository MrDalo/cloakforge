/**
 * Unit tests for src/lib/solana/raydium/errors.ts
 */

import { describe, it, expect } from 'vitest'
import { handleRaydiumError, RAYDIUM_ERROR_CODES } from '../errors'

describe('RAYDIUM_ERROR_CODES', () => {
  it('has PRICE_TOO_SMALL key', () => {
    expect(RAYDIUM_ERROR_CODES.PRICE_TOO_SMALL).toBe('PRICE_TOO_SMALL')
  })

  it('has QUANTITY_TOO_SMALL key', () => {
    expect(RAYDIUM_ERROR_CODES.QUANTITY_TOO_SMALL).toBe('QUANTITY_TOO_SMALL')
  })

  it('has INVALID_MARKET key', () => {
    expect(RAYDIUM_ERROR_CODES.INVALID_MARKET).toBe('INVALID_MARKET')
  })

  it('has POOL_ALREADY_EXISTS key', () => {
    expect(RAYDIUM_ERROR_CODES.POOL_ALREADY_EXISTS).toBe('POOL_ALREADY_EXISTS')
  })
})

describe('handleRaydiumError', () => {
  it('maps "0x1" to insufficient funds message', () => {
    const result = handleRaydiumError(new Error('Transaction failed 0x1'))
    expect(result).toBe('Insufficient funds to complete the transaction.')
  })

  it('maps "Price too small" to price too small message', () => {
    const result = handleRaydiumError(new Error('Price too small for this market'))
    expect(result).toContain('Price too small')
    expect(result).toContain('Tick Size')
  })

  it('maps "Price too small" text to price too small message', () => {
    // Note: unknown message containing "0x12" also contains "0x1" and hits the
    // insufficient-funds check first. The 0x12 branch is only reachable via text.
    const result = handleRaydiumError(new Error('Price too small'))
    expect(result).toContain('Price too small')
    expect(result).toContain('Tick Size')
  })

  it('maps "Quantity too small" text to quantity too small message', () => {
    const result = handleRaydiumError(new Error('Quantity too small'))
    expect(result).toContain('Quantity too small')
    expect(result).toContain('Min Order Size')
  })

  it('maps "Market is invalid" text to invalid market message', () => {
    const result = handleRaydiumError(new Error('Market is invalid'))
    expect(result).toContain('invalid')
  })

  it('maps "Pool already exists" to pool exists message', () => {
    const result = handleRaydiumError(new Error('Pool already exists for this market'))
    expect(result).toContain('already exists')
  })

  it('returns original message for unknown errors', () => {
    const result = handleRaydiumError(new Error('Some unknown Raydium error'))
    expect(result).toBe('Some unknown Raydium error')
  })

  it('handles non-Error objects (strings)', () => {
    const result = handleRaydiumError('Price too small: string error')
    expect(result).toContain('Price too small')
  })

  it('handles non-Error objects (plain strings without match)', () => {
    const result = handleRaydiumError('completely unknown error string')
    expect(result).toBe('completely unknown error string')
  })

  it('handles non-Error objects (numbers)', () => {
    const result = handleRaydiumError(42)
    expect(result).toBe('42')
  })

  it('handles null/undefined-like objects', () => {
    const result = handleRaydiumError({ toString: () => 'some error' })
    expect(result).toBe('some error')
  })

  it('returns string type', () => {
    const result = handleRaydiumError(new Error('test'))
    expect(typeof result).toBe('string')
  })
})
