import { describe, it, expect } from 'vitest'
import { Keypair } from '@solana/web3.js'
import { metaplexMetadataData, type MetaplexMetadataFixture } from '@/__tests__/utils/mintAccountFixtures'
import { parseMetaplexMetadata } from '../parseMetaplexMetadata'

const UPDATE_AUTHORITY = Keypair.generate().publicKey
const MINT = Keypair.generate().publicKey

const fixture = (overrides: Partial<MetaplexMetadataFixture> = {}): Buffer =>
  metaplexMetadataData({ updateAuthority: UPDATE_AUTHORITY, mint: MINT, ...overrides })

describe('parseMetaplexMetadata', () => {
  it('should parse authorities, NUL-padded strings and the mutability flag', () => {
    const parsed = parseMetaplexMetadata(fixture({ isMutable: false }))
    expect(parsed?.updateAuthority.equals(UPDATE_AUTHORITY)).toBe(true)
    expect(parsed?.mint.equals(MINT)).toBe(true)
    expect(parsed?.name.replace(/\0/g, '')).toBe('Test Token')
    expect(parsed?.symbol.replace(/\0/g, '')).toBe('TST')
    expect(parsed?.uri.replace(/\0/g, '')).toBe('https://example.com/m.json')
    expect(parsed?.isMutable).toBe(false)
  })

  it('should skip the creators list before reading the mutability flag', () => {
    const creators = [Keypair.generate().publicKey, Keypair.generate().publicKey]
    expect(parseMetaplexMetadata(fixture({ creators, isMutable: true }))?.isMutable).toBe(true)
    expect(parseMetaplexMetadata(fixture({ creators, isMutable: false }))?.isMutable).toBe(false)
  })

  it('should return null for another account type', () => {
    expect(parseMetaplexMetadata(fixture({ key: 6 }))).toBeNull()
  })

  it('should return null for truncated data instead of throwing', () => {
    const data = fixture()
    expect(parseMetaplexMetadata(data.subarray(0, 80))).toBeNull()
    expect(parseMetaplexMetadata(Buffer.alloc(0))).toBeNull()
  })

  it('should reject oversized strings and creator counts without allocating them', () => {
    const data = fixture()
    data.writeUInt32LE(0xffffffff, 65) // name length
    expect(parseMetaplexMetadata(data)).toBeNull()

    const tooManyCreators = fixture({ creators: [Keypair.generate().publicKey], creatorCount: 1_000 })
    expect(parseMetaplexMetadata(tooManyCreators)).toBeNull()
  })
})
