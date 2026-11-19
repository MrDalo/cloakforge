import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicKey, type Connection } from '@solana/web3.js'
import { AppError } from '@/lib/errors'

vi.mock('@/lib/solana/getTokenMetadata', () => ({
  getTokenMetadata: vi.fn(),
}))

import { getTokenMetadata } from '@/lib/solana/getTokenMetadata'
import { validateMultisenderToken } from '../validateMultisenderToken'

const MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
const connection = {} as Connection

const USDC_METADATA = {
  mint: MINT.toBase58(),
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  image: 'https://example.com/usdc.png',
  programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  source: 'metaplex' as const,
}

describe('validateMultisenderToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTokenMetadata).mockResolvedValue(USDC_METADATA)
  })

  it('should fetch metadata for the mint with images at confirmed commitment', async () => {
    await validateMultisenderToken(MINT, connection)

    expect(getTokenMetadata).toHaveBeenCalledWith(MINT.toBase58(), connection, { includeImages: true, commitment: 'confirmed' })
  })

  it('should accept any existing mint and return its token data', async () => {
    const result = await validateMultisenderToken(MINT, connection)

    expect(result).toEqual({
      isValid: true,
      tokenData: {
        tokenAddress: MINT.toBase58(),
        mint: MINT.toBase58(),
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        balance: { amount: '0', decimals: 6, uiAmount: 0, uiAmountString: '0' },
        image: 'https://example.com/usdc.png',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        source: 'mint-only',
      },
    })
  })

  it('should carry the mint decimals through so amounts are scaled correctly', async () => {
    vi.mocked(getTokenMetadata).mockResolvedValueOnce({ ...USDC_METADATA, decimals: 2 })
    const result = await validateMultisenderToken(MINT, connection)

    expect(result.tokenData?.decimals).toBe(2)
    expect(result.tokenData?.balance.decimals).toBe(2)
  })

  it('should preserve the Token-2022 program id of the mint', async () => {
    const token2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
    vi.mocked(getTokenMetadata).mockResolvedValueOnce({ ...USDC_METADATA, programId: token2022, source: 'token-2022' })

    const result = await validateMultisenderToken(MINT, connection)
    expect(result.tokenData?.programId).toBe(token2022)
  })

  it('should not require any authority over the token (no authority check)', async () => {
    const result = await validateMultisenderToken(MINT, connection)

    expect(result.isValid).toBe(true)
    expect(result.tokenData).not.toHaveProperty('mintAuthority')
    expect(result.tokenData).not.toHaveProperty('freezeAuthority')
  })

  it('should report an invalid mint when the token mint does not exist', async () => {
    vi.mocked(getTokenMetadata).mockRejectedValueOnce(new AppError('NOT_FOUND', 'Token mint not found'))

    const result = await validateMultisenderToken(MINT, connection)
    expect(result).toEqual({ isValid: false, error: 'Invalid token mint address.' })
  })

  it('should report a retryable error for RPC failures', async () => {
    vi.mocked(getTokenMetadata).mockRejectedValueOnce(new Error('fetch failed'))

    const result = await validateMultisenderToken(MINT, connection)
    expect(result).toEqual({ isValid: false, error: 'Failed to fetch token information. Please try again.' })
  })

  it('should report a generic invalid mint error for non-Error rejections', async () => {
    vi.mocked(getTokenMetadata).mockRejectedValueOnce('boom')

    const result = await validateMultisenderToken(MINT, connection)
    expect(result).toEqual({ isValid: false, error: 'Invalid mint address.' })
  })
})
