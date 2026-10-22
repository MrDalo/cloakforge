import { describe, it, expect } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import ofacList from '../data/ofac-sol-addresses.json'
import { isBlockedLocation, isSanctionedAddress } from '../sanctions'

describe('isBlockedLocation', () => {
  it.each(['CU', 'IR', 'KP', 'RU', 'BY', 'ru'])('should block country %s', (country) => {
    expect(isBlockedLocation(country, null)).toBe(true)
  })

  it.each(['43', '40', '14', '09', '23', '65', 'UA-43'])('should block Ukrainian region %s', (region) => {
    expect(isBlockedLocation('UA', region)).toBe(true)
  })

  it.each([
    ['UA', '30'],
    ['UA', null],
    ['UA', ''],
    ['CZ', '43'],
    ['US', null],
    ['SY', null],
  ])('should allow %s / %s', (country, region) => {
    expect(isBlockedLocation(country, region)).toBe(false)
  })

  it('should allow requests without geo headers (local dev, non-Vercel hosts)', () => {
    expect(isBlockedLocation(null, null)).toBe(false)
    expect(isBlockedLocation(undefined, undefined)).toBe(false)
    expect(isBlockedLocation('', '43')).toBe(false)
  })
})

describe('isSanctionedAddress', () => {
  it('should flag every bundled OFAC address', () => {
    expect(ofacList.addresses.length).toBeGreaterThan(0)
    for (const address of ofacList.addresses) {
      expect(isSanctionedAddress(address)).toBe(true)
    }
  })

  it('should not flag clean addresses or near-matches', () => {
    expect(isSanctionedAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(false)
    expect(isSanctionedAddress(ofacList.addresses[0].toLowerCase())).toBe(false)
    expect(isSanctionedAddress('')).toBe(false)
  })

  it('should bundle only valid 32-byte base58 keys with provenance metadata', () => {
    expect(ofacList.source).toMatch(/^https:\/\//)
    expect(Number.isNaN(Date.parse(ofacList.fetchedAt))).toBe(false)
    for (const address of ofacList.addresses) {
      expect(new PublicKey(address).toBytes()).toHaveLength(32)
    }
  })
})
