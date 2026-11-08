import { describe, it, expect } from 'vitest'
import { tokenAuditMintAddressSchema } from '../tokenAuditSchemas'

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

describe('tokenAuditMintAddressSchema', () => {
  it('should accept a base58 mint address and trim surrounding whitespace', () => {
    expect(tokenAuditMintAddressSchema.parse(USDC_MINT)).toBe(USDC_MINT)
    expect(tokenAuditMintAddressSchema.parse(`\n ${USDC_MINT}\t`)).toBe(USDC_MINT)
  })

  it.each([
    ['empty', ''],
    ['too short', 'EPjFWdd5Auf'],
    ['non-base58 characters', `${USDC_MINT.slice(0, 40)}0OIl`],
    ['inner whitespace', `${USDC_MINT.slice(0, 20)} ${USDC_MINT.slice(20)}`],
    ['markup', `<img src=x>${USDC_MINT}`],
    ['too long', `${USDC_MINT}${USDC_MINT}`],
  ])('should reject %s', (_label, value) => {
    expect(tokenAuditMintAddressSchema.safeParse(value).success).toBe(false)
  })
})
