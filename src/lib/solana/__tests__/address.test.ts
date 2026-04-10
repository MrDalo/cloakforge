/**
 * Unit tests for src/lib/solana/address.ts
 */

import { describe, it, expect } from 'vitest'

// address.ts does not use the logger; this mock is inherited from global setup
// but declared here explicitly for clarity in case this file is run in isolation.

import { isValidSolanaAddress, shortenAddress, convertAddressToPublicKey, convertPublicKeyToAddress } from '../address'
import { PublicKey } from '@solana/web3.js'
import type { Address } from '@solana/kit'

// Real valid Solana addresses
const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const WSOL_ADDRESS = 'So11111111111111111111111111111111111111112'
const USDT_ADDRESS = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const SYSTEM_PROGRAM = '11111111111111111111111111111111'

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

  // NOTE: The try/catch in isValidSolanaAddress (catch → return false) cannot be
  // exercised in this integration-style file. @solana/kit is a sealed ESM module —
  // its exports are non-configurable, so neither vi.spyOn nor direct assignment can
  // replace isAddress at runtime. Covering this branch would require a separate
  // vi.mock() factory test file, which would prevent importing the real library needed
  // by all other tests. Reported as an untestable area in the test coverage summary.

  it('returns false for a string that is too long to be a valid Solana address', () => {
    const tooLong = 'A'.repeat(45)
    expect(isValidSolanaAddress(tooLong)).toBe(false)
  })

  it('returns true for a 32-character system program address', () => {
    expect(isValidSolanaAddress(SYSTEM_PROGRAM)).toBe(true)
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

  it('shortens with chars = 8', () => {
    const result = shortenAddress(USDC_ADDRESS, 8)
    expect(result).toBe(`${USDC_ADDRESS.slice(0, 8)}...${USDC_ADDRESS.slice(-8)}`)
  })

  it('shortens with chars = 2', () => {
    const result = shortenAddress(USDC_ADDRESS, 2)
    expect(result).toBe(`${USDC_ADDRESS.slice(0, 2)}...${USDC_ADDRESS.slice(-2)}`)
  })

  it('produces exactly one ellipsis separator', () => {
    const result = shortenAddress(USDC_ADDRESS, 4)
    expect(result.split('...').length).toBe(2)
  })

  it('accepts a Kit Address type (branded string) without error', () => {
    // Address is a branded string in @solana/kit — casting confirms the type path works
    const kitAddr = USDC_ADDRESS as Address
    const result = shortenAddress(kitAddr, 4)
    expect(result).toBe(`${USDC_ADDRESS.slice(0, 4)}...${USDC_ADDRESS.slice(-4)}`)
  })

  it('returns a very long address shortened to the first and last 4 chars', () => {
    // 100-char string of valid base58 chars
    const longAddr = 'A'.repeat(100)
    const result = shortenAddress(longAddr, 4)
    expect(result).toBe(`AAAA...AAAA`)
  })

  it('returns the address unchanged when length equals exactly chars * 2', () => {
    // "12345678" is 8 chars, chars = 4; 8 <= 8 → return as-is
    const addr = '12345678'
    expect(shortenAddress(addr, 4)).toBe(addr)
  })

  it('returns the address unchanged when length is less than chars * 2', () => {
    // "abc" is 3 chars, chars = 4; 3 <= 8 → return as-is
    expect(shortenAddress('abc', 4)).toBe('abc')
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

  it('returns an object with a toBase58 method (PublicKey interface)', () => {
    const { address } = require('@solana/kit')
    const kitAddr = address(USDC_ADDRESS)
    const pubkey = convertAddressToPublicKey(kitAddr)
    expect(typeof pubkey.toBase58).toBe('function')
  })

  it('propagates errors thrown by the PublicKey constructor for invalid input', () => {
    // Force a bad Address value (bypassing Kit's brand check) to exercise the
    // error path in the PublicKey constructor.
    const badAddr = 'not-a-real-address' as Address
    expect(() => convertAddressToPublicKey(badAddr)).toThrow()
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

  it('converts USDT PublicKey to Kit Address', () => {
    const pubkey = new PublicKey(USDT_ADDRESS)
    const result = convertPublicKeyToAddress(pubkey)
    expect(result).toBe(USDT_ADDRESS)
  })

  it('returns a value that equals publicKey.toString()', () => {
    const pubkey = new PublicKey(USDC_ADDRESS)
    const result = convertPublicKeyToAddress(pubkey)
    expect(result).toBe(pubkey.toString())
  })

  it('uses publicKey.toString() to derive the address string', () => {
    // Verify the conversion uses the canonical string representation
    const pubkey = new PublicKey(WSOL_ADDRESS)
    const result = convertPublicKeyToAddress(pubkey)
    expect(result).toBe(pubkey.toBase58())
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
