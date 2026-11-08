/**
 * Unit tests for src/lib/schemas/ipfsSchemas.ts
 */

import { describe, it, expect } from 'vitest'
import { isAllowedAssetUri, isReusableAssetUri, metadataUriSchema, tokenMetadataUploadSchema } from '../ipfsSchemas'
import { tokenCreatorRequestSchema, updateMetadataRequestSchema } from '../apiSchemas'

const WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const LOGO = 'https://example.mypinata.cloud/ipfs/bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy'

/** Same shape useTokenCreator / useUpdateMetadata build. */
const CLIENT_METADATA = {
  name: 'My Token',
  symbol: 'MTK',
  description: 'A test token\nwith two lines',
  image: LOGO,
  external_url: 'https://example.com',
  attributes: [
    { trait_type: 'Twitter', value: 'https://x.com/mytoken' },
    { trait_type: 'X', value: 'https://x.com/mytoken' },
    { trait_type: 'Telegram', value: '@mytoken' },
    { trait_type: 'Discord', value: 'discord.gg/abc123' },
  ],
  created_with: 'CloakForge',
  properties: {
    files: [{ uri: LOGO, type: 'image' }],
    category: 'token',
    creators: [{ address: WALLET, share: 100, verified: false }],
  },
}

describe('tokenMetadataUploadSchema', () => {
  it('should accept the metadata built by the token creator and update flows', () => {
    expect(tokenMetadataUploadSchema.safeParse(CLIENT_METADATA).success).toBe(true)
    expect(
      tokenMetadataUploadSchema.safeParse({ name: 'Token', symbol: 'TKN', properties: { files: [], category: 'token' } }).success
    ).toBe(true)
  })

  it('should accept ipfs:// and ar:// images and https extensions', () => {
    const result = tokenMetadataUploadSchema.safeParse({
      name: 'Token',
      symbol: 'TKN',
      image: 'ipfs://bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy',
      extensions: { website: 'https://example.com', twitter: 'https://x.com/t' },
    })
    expect(result.success).toBe(true)
    expect(
      tokenMetadataUploadSchema.safeParse({ name: 'T', symbol: '', image: 'ar://abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG' }).success
    ).toBe(true)
  })

  it('should reject unknown top-level and nested keys', () => {
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, data: 'x' }).success).toBe(false)
    expect(
      tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, properties: { ...CLIENT_METADATA.properties, extra: {} } }).success
    ).toBe(false)
    expect(
      tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, attributes: [{ trait_type: 'X', value: 'y', extra: 1 }] }).success
    ).toBe(false)
  })

  it('should reject javascript:, data: and http: image URLs', () => {
    for (const image of [
      'javascript:alert(1)',
      'data:image/svg+xml;base64,PHN2Zz4=',
      'http://example.com/logo.png',
      'ftp://example.com/a.png',
    ]) {
      expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, image }).success).toBe(false)
    }
  })

  it('should reject javascript: links in external_url, attributes, files and extensions', () => {
    const js = 'javascript:alert(document.cookie)'
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, external_url: js }).success).toBe(false)
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, attributes: [{ trait_type: 'Twitter', value: js }] }).success).toBe(
      false
    )
    expect(
      tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, attributes: [{ trait_type: 'Twitter', value: 'JavaScript:alert(1)' }] })
        .success
    ).toBe(false)
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, properties: { files: [{ uri: js, type: 'image' }] } }).success).toBe(
      false
    )
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, extensions: { website: js } }).success).toBe(false)
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, extensions: { website: 'http://example.com' } }).success).toBe(false)
  })

  it('should enforce field length limits', () => {
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, name: 'n'.repeat(33) }).success).toBe(false)
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, symbol: 'S'.repeat(11) }).success).toBe(false)
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, description: 'd'.repeat(501) }).success).toBe(false)
    expect(
      tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, external_url: `https://example.com/${'a'.repeat(200)}` }).success
    ).toBe(false)
    expect(
      tokenMetadataUploadSchema.safeParse({
        ...CLIENT_METADATA,
        attributes: Array.from({ length: 11 }, () => ({ trait_type: 'X', value: 'y' })),
      }).success
    ).toBe(false)
  })

  it('should reject missing name, wrong types and control characters', () => {
    const { name: _name, ...withoutName } = CLIENT_METADATA
    void _name
    expect(tokenMetadataUploadSchema.safeParse(withoutName).success).toBe(false)
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, name: 42 }).success).toBe(false)
    expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, name: 'bad\u0000name' }).success).toBe(false)
    expect(tokenMetadataUploadSchema.safeParse([CLIENT_METADATA]).success).toBe(false)
  })

  it('should reject invalid creators', () => {
    const properties = (creators: unknown) => ({ ...CLIENT_METADATA, properties: { ...CLIENT_METADATA.properties, creators } })
    expect(tokenMetadataUploadSchema.safeParse(properties([{ address: 'not-an-address', share: 100 }])).success).toBe(false)
    expect(tokenMetadataUploadSchema.safeParse(properties([{ address: WALLET, share: 101 }])).success).toBe(false)
  })
})

describe('isAllowedAssetUri', () => {
  it('should allow https, ipfs and ar URIs', () => {
    expect(isAllowedAssetUri(LOGO)).toBe(true)
    expect(isAllowedAssetUri('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/logo.png')).toBe(true)
    expect(isAllowedAssetUri('ipfs://ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')).toBe(true)
  })

  it('should reject other schemes, credentials and malformed ipfs URIs', () => {
    expect(isAllowedAssetUri('http://example.com/a.png')).toBe(false)
    expect(isAllowedAssetUri('https://user:pass@example.com/a.png')).toBe(false)
    expect(isAllowedAssetUri('ipfs://short')).toBe(false)
    expect(isAllowedAssetUri('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/"><script>')).toBe(false)
    expect(isAllowedAssetUri('vbscript:msgbox(1)')).toBe(false)
  })
})

describe('isReusableAssetUri', () => {
  it('should accept the asset URIs upload-json accepts for image / files[].uri', () => {
    for (const uri of [
      LOGO,
      'ipfs://bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy',
      'ar://abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
    ]) {
      expect(isReusableAssetUri(uri)).toBe(true)
      expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, image: uri }).success).toBe(true)
    }
  })

  it('should reject the asset URIs upload-json rejects (http, data:, credentials, over 512 characters, empty)', () => {
    for (const uri of [
      'http://cdn.example.com/logo.png',
      'data:image/png;base64,iVBORw0KGgo=',
      'https://user:pass@cdn.example.com/logo.png',
      `https://cdn.example.com/${'a'.repeat(600)}.png`,
      '   ',
    ]) {
      expect(isReusableAssetUri(uri)).toBe(false)
      expect(tokenMetadataUploadSchema.safeParse({ ...CLIENT_METADATA, image: uri }).success).toBe(false)
    }
  })
})

describe('metadataUriSchema (WEB3-17)', () => {
  it('should accept https/ipfs/ar URIs up to 200 characters and empty strings', () => {
    expect(
      metadataUriSchema.safeParse('https://gateway.example/ipfs/bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy').success
    ).toBe(true)
    expect(metadataUriSchema.safeParse('ipfs://QmMetadataHash').success).toBe(true)
    expect(metadataUriSchema.safeParse('').success).toBe(true)
  })

  it('should reject internal http URIs, other schemes and oversize URIs', () => {
    expect(metadataUriSchema.safeParse('http://10.0.0.1/').success).toBe(false)
    expect(metadataUriSchema.safeParse('javascript:alert(1)').success).toBe(false)
    expect(metadataUriSchema.safeParse(`https://example.com/${'a'.repeat(200)}`).success).toBe(false)
  })

  it('should be enforced on token-creator and update-metadata requests', () => {
    for (const schema of [tokenCreatorRequestSchema.shape.metadata, updateMetadataRequestSchema.shape.metadata]) {
      expect(schema.safeParse({ metadataUri: 'ipfs://QmMetadataHash', logoUri: LOGO }).success).toBe(true)
      expect(schema.safeParse({ metadataUri: 'http://169.254.169.254/latest' }).success).toBe(false)
      expect(schema.safeParse({ logoUri: 'javascript:alert(1)' }).success).toBe(false)
    }
  })
})
