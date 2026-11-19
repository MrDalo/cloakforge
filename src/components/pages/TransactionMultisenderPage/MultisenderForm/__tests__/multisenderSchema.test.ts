import { describe, it, expect } from 'vitest'
import { MultisenderFormSchema, TOKEN_NOT_VALIDATED_MESSAGE, isTokenValidated, type MultisenderFormData } from '../multisenderSchema'

const VALID_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const VALID_TOKEN_ACCOUNT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

const validTokenInfo = {
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  mintAddress: VALID_MINT,
  balance: 100,
  uiAmount: 100,
  tokenAccountAddress: VALID_TOKEN_ACCOUNT,
}

const validData: MultisenderFormData = {
  tokenAddress: VALID_MINT,
  recipientsInput: 'So11111111111111111111111111111111111111112 1.5',
  confirmSend: true,
  tokenInfo: validTokenInfo,
}

const issuesFor = (data: unknown) => {
  const result = MultisenderFormSchema.safeParse(data)
  return result.success ? [] : result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
}

describe('MultisenderFormSchema', () => {
  // ---------------------------------------------------------------------------
  // Valid data
  // ---------------------------------------------------------------------------

  it('should accept a complete form with resolved token info', () => {
    expect(MultisenderFormSchema.safeParse(validData).success).toBe(true)
  })

  it('should accept a token address with surrounding whitespace when the metadata matches the trimmed address', () => {
    expect(MultisenderFormSchema.safeParse({ ...validData, tokenAddress: `  ${VALID_MINT} ` }).success).toBe(true)
  })

  it('should accept token info without the optional name, symbol and totalSupply', () => {
    const { name: _name, symbol: _symbol, ...minimalTokenInfo } = validTokenInfo
    void _name
    void _symbol
    expect(MultisenderFormSchema.safeParse({ ...validData, tokenInfo: minimalTokenInfo }).success).toBe(true)
  })

  it('should keep the raw recipients text untouched (line parsing happens on submit)', () => {
    const recipientsInput = 'not-an-address 1\n\n  garbage  '
    const result = MultisenderFormSchema.parse({ ...validData, recipientsInput })
    expect(result.recipientsInput).toBe(recipientsInput)
  })

  // ---------------------------------------------------------------------------
  // Required fields
  // ---------------------------------------------------------------------------

  it('should require a token to be selected', () => {
    expect(issuesFor({ ...validData, tokenAddress: '', tokenInfo: undefined })).toEqual([
      { path: 'tokenAddress', message: 'Please select a token' },
    ])
  })

  it('should reject a token address whose metadata was never resolved', () => {
    expect(issuesFor({ ...validData, tokenInfo: undefined })).toEqual([{ path: 'tokenAddress', message: TOKEN_NOT_VALIDATED_MESSAGE }])
  })

  it('should reject a token address that was edited after validation (stale metadata)', () => {
    expect(issuesFor({ ...validData, tokenAddress: VALID_TOKEN_ACCOUNT })).toEqual([
      { path: 'tokenAddress', message: TOKEN_NOT_VALIDATED_MESSAGE },
    ])
  })

  it('should require at least one recipient line', () => {
    expect(issuesFor({ ...validData, recipientsInput: '' })).toEqual([
      { path: 'recipientsInput', message: 'At least one recipient is required' },
    ])
  })

  it('should require the send confirmation to be checked', () => {
    expect(issuesFor({ ...validData, confirmSend: false })).toEqual([
      { path: 'confirmSend', message: 'You must confirm that you understand the send operation' },
    ])
  })

  it('should reject a non-boolean confirmation', () => {
    expect(MultisenderFormSchema.safeParse({ ...validData, confirmSend: 'true' }).success).toBe(false)
  })

  it('should report every missing field of an empty form at once', () => {
    const paths = issuesFor({ tokenAddress: '', recipientsInput: '', confirmSend: false }).map((issue) => issue.path)
    expect(paths).toEqual(expect.arrayContaining(['tokenAddress', 'recipientsInput', 'confirmSend']))
  })

  it('should not complain about token validation while no token address is entered', () => {
    const messages = issuesFor({ tokenAddress: '', recipientsInput: 'x', confirmSend: true }).map((issue) => issue.message)
    expect(messages).not.toContain(TOKEN_NOT_VALIDATED_MESSAGE)
  })

  it('should reject missing keys', () => {
    const paths = issuesFor({}).map((issue) => issue.path)
    expect(paths).toEqual(expect.arrayContaining(['tokenAddress', 'recipientsInput', 'confirmSend']))
  })

  // ---------------------------------------------------------------------------
  // Token info validation
  // ---------------------------------------------------------------------------

  it('should reject token info with an invalid mint address', () => {
    const issues = issuesFor({ ...validData, tokenInfo: { ...validTokenInfo, mintAddress: 'not-a-mint' } })
    expect(issues).toContainEqual({ path: 'tokenInfo.mintAddress', message: 'Invalid Solana address' })
  })

  it('should reject token info with an invalid token account address', () => {
    const issues = issuesFor({ ...validData, tokenInfo: { ...validTokenInfo, tokenAccountAddress: '0OIl' } })
    expect(issues).toEqual([{ path: 'tokenInfo.tokenAccountAddress', message: 'Invalid Solana address' }])
  })

  it('should require numeric decimals in token info', () => {
    const issues = issuesFor({ ...validData, tokenInfo: { ...validTokenInfo, decimals: '6' } })
    expect(issues.map((issue) => issue.path)).toEqual(['tokenInfo.decimals'])
  })

  it('should require balance and uiAmount in token info', () => {
    const { balance: _balance, uiAmount: _uiAmount, ...withoutBalance } = validTokenInfo
    void _balance
    void _uiAmount
    const paths = issuesFor({ ...validData, tokenInfo: withoutBalance }).map((issue) => issue.path)
    expect(paths).toEqual(expect.arrayContaining(['tokenInfo.balance', 'tokenInfo.uiAmount']))
  })
})

describe('isTokenValidated', () => {
  it('should be true only when token info exists for the (trimmed) selected address', () => {
    expect(isTokenValidated({ tokenAddress: VALID_MINT, tokenInfo: validTokenInfo })).toBe(true)
    expect(isTokenValidated({ tokenAddress: ` ${VALID_MINT} `, tokenInfo: validTokenInfo })).toBe(true)
    expect(isTokenValidated({ tokenAddress: VALID_MINT, tokenInfo: undefined })).toBe(false)
    expect(isTokenValidated({ tokenAddress: VALID_TOKEN_ACCOUNT, tokenInfo: validTokenInfo })).toBe(false)
    expect(isTokenValidated({ tokenAddress: '', tokenInfo: undefined })).toBe(false)
  })
})
