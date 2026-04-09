/**
 * Unit tests for src/lib/solana/address.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { isValidSolanaAddress, shortenAddress, convertAddressToPublicKey, convertPublicKeyToAddress } from '../address'
import { PublicKey } from '@solana/web3.js'

// Real valid Solana addresses
const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const WSOL_ADDRESS = 'So11111111111111111111111111111111111111112'
const USDT_ADDRESS = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

describe('isValidSolanaAddress', () => {
  it('returns true for a valid USDC address', () => {
    expect(isValidSolanaAddress(USDC_ADDRESS)).toBe(true)
  })

  it('returns true for a valid wSOL address', () => {
    expect(isValidSolanaAddress(WSOL_ADDRESS)).toBe(true)
  })

  it('returns true for a valid USDT address', () => {
    expect(isValidSolanaAddress(USDT_ADDRESS)).toBe(true)
  })

  it('returns false for an empty string', () => {
    expect(isValidSolanaAddress('')).toBe(false)
  })

  it('returns false for a clearly invalid string', () => {
    expect(isValidSolanaAddress('not-a-valid-address')).toBe(false)
  })

  it('returns false for an address with invalid characters (O, 0, I, l)', () => {
    // Base58 doesn't include 0, O, I, l
    expect(isValidSolanaAddress('0000000000000000000000000000000000000000000')).toBe(false)
  })

  it('returns false for a string that is too short', () => {
    expect(isValidSolanaAddress('abc')).toBe(false)
  })

  it('returns false for a string with spaces', () => {
    expect(isValidSolanaAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4 wEGGkZwyTDt1v')).toBe(false)
  })

  it('does not throw on unusual input', () => {
    expect(() => isValidSolanaAddress('!!@@##')).not.toThrow()
    expect(isValidSolanaAddress('!!@@##')).toBe(false)
  })
})

describe('shortenAddress', () => {
  it('shortens a long address with default 4 chars', () => {
    const result = shortenAddress(USDC_ADDRESS)
    expect(result).toBe(`${USDC_ADDRESS.slice(0, 4)}...${USDC_ADDRESS.slice(-4)}`)
  })

  it('shortens a long address with custom char count', () => {
    const result = shortenAddress(USDC_ADDRESS, 6)
    expect(result).toBe(`${USDC_ADDRESS.slice(0, 6)}...${USDC_ADDRESS.slice(-6)}`)
  })

  it('returns the full address if it is shorter than or equal to chars * 2', () => {
    const shortAddr = 'abcd1234'
    // 8 chars, chars * 2 = 8 — should return as-is
    expect(shortenAddress(shortAddr, 4)).toBe(shortAddr)
  })

  it('returns empty string for empty input', () => {
    expect(shortenAddress('')).toBe('')
  })

  it('returns the full address if length is exactly chars * 2', () => {
    const addr = '12345678' // 8 chars
    expect(shortenAddress(addr, 4)).toBe(addr)
  })

  it('works with 1 char on each side', () => {
    const result = shortenAddress(USDC_ADDRESS, 1)
    expect(result).toBe(`${USDC_ADDRESS[0]}...${USDC_ADDRESS[USDC_ADDRESS.length - 1]}`)
  })

  it('works with wSOL address', () => {
    const result = shortenAddress(WSOL_ADDRESS, 4)
    expect(result).toBe(`${WSOL_ADDRESS.slice(0, 4)}...${WSOL_ADDRESS.slice(-4)}`)
  })
})

describe('convertAddressToPublicKey', () => {
  it('converts a valid Kit Address to a PublicKey', () => {
    const { address } = require('@solana/kit')
    const kitAddr = address(USDC_ADDRESS)
    const pubkey = convertAddressToPublicKey(kitAddr)
    expect(pubkey).toBeInstanceOf(PublicKey)
    expect(pubkey.toBase58()).toBe(USDC_ADDRESS)
  })

  it('converts wSOL address to a PublicKey', () => {
    const { address } = require('@solana/kit')
    const kitAddr = address(WSOL_ADDRESS)
    const pubkey = convertAddressToPublicKey(kitAddr)
    expect(pubkey.toBase58()).toBe(WSOL_ADDRESS)
  })

  it('converts USDT address to a PublicKey', () => {
    const { address } = require('@solana/kit')
    const kitAddr = address(USDT_ADDRESS)
    const pubkey = convertAddressToPublicKey(kitAddr)
    expect(pubkey.toBase58()).toBe(USDT_ADDRESS)
  })
})

describe('convertPublicKeyToAddress', () => {
  it('converts a PublicKey to a Kit Address string', () => {
    const pubkey = new PublicKey(USDC_ADDRESS)
    const result = convertPublicKeyToAddress(pubkey)
    expect(typeof result).toBe('string')
    expect(result).toBe(USDC_ADDRESS)
  })

  it('converts wSOL PublicKey to Kit Address', () => {
    const pubkey = new PublicKey(WSOL_ADDRESS)
    const result = convertPublicKeyToAddress(pubkey)
    expect(result).toBe(WSOL_ADDRESS)
  })
})

describe('round-trip conversions', () => {
  it('USDC address survives a round-trip through PublicKey and back', () => {
    const { address } = require('@solana/kit')
    const kitAddr = address(USDC_ADDRESS)
    const pubkey = convertAddressToPublicKey(kitAddr)
    const backToAddress = convertPublicKeyToAddress(pubkey)
    expect(backToAddress).toBe(USDC_ADDRESS)
  })

  it('wSOL address survives a round-trip through PublicKey and back', () => {
    const { address } = require('@solana/kit')
    const kitAddr = address(WSOL_ADDRESS)
    const pubkey = convertAddressToPublicKey(kitAddr)
    const backToAddress = convertPublicKeyToAddress(pubkey)
    expect(backToAddress).toBe(WSOL_ADDRESS)
  })

  it('PublicKey survives a round-trip through Kit Address and back', () => {
    const original = new PublicKey(USDT_ADDRESS)
    const kitAddr = convertPublicKeyToAddress(original)
    const backToPubkey = convertAddressToPublicKey(kitAddr)
    expect(backToPubkey.toBase58()).toBe(original.toBase58())
  })
})
