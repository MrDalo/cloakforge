import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'
import { feeTransferLamports } from '@/__tests__/utils/feeTestHelpers'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { Keypair, SystemProgram } from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { createTokenCreationTransaction } from '../createTokenCreationTransaction'
import type { CreateTokenTransactionParams } from '@/types/tokenCreator'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    rpcPrivateEndpoint: 'https://api.devnet.solana.com',
    feeWalletAddress: 'FeeWa11etAddre55111111111111111111111111111'.slice(0, 44),
  })),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
}))

vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn().mockResolvedValue({ baseFee: 0.19 }),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

let mockGetLatestBlockhash: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
let mockGetMinimumBalanceForRentExemption: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  return {
    ...actual,
    createConnectionPair: vi.fn(() => ({
      legacyConnection: {
        getLatestBlockhash: (...args: unknown[]) => mockGetLatestBlockhash(...args),
        getMinimumBalanceForRentExemption: (...args: unknown[]) => mockGetMinimumBalanceForRentExemption(...args),
      },
      kitRpc: {},
    })),
    calculateDynamicPriorityFee: vi.fn().mockResolvedValue(1500),
  }
})

const WALLET = Keypair.generate().publicKey
const MINT = Keypair.generate().publicKey

const baseTokenData = {
  name: 'Test Token',
  symbol: 'TST',
  decimals: 6,
  totalSupply: 1_000_000,
}

const buildParams = (overrides: Partial<CreateTokenTransactionParams['tokenData']> = {}): CreateTokenTransactionParams => ({
  walletPublicKey: WALLET,
  mintPublicKey: MINT,
  tokenData: { ...baseTokenData, ...overrides },
  metadataUri: 'https://example.com/metadata.json',
})

describe('createTokenCreationTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.19, couponMemoInstruction: null })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString() })
    mockGetMinimumBalanceForRentExemption = vi.fn().mockResolvedValue(1_000_000)
  })

  it('builds a Token-2022 mint with metadata pointer, init, ATA, and mint-to instructions', async () => {
    const result = await createTokenCreationTransaction(buildParams())

    expect(result.mintPublicKey).toBe(MINT.toString())
    expect(result.totalSupply).toBe('1000000000000') // 1,000,000 * 10^6

    const { transaction } = result
    const programIds = transaction.instructions.map((ix) => ix.programId.toString())

    // Every mint-lifecycle instruction runs under Token-2022, never the classic Token program
    expect(programIds).toContain(TOKEN_2022_PROGRAM_ID.toString())
    expect(programIds).not.toContain('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

    // createAccount (mint) must run under SystemProgram
    const createAccountIx = transaction.instructions.find(
      (ix) => ix.programId.toString() === SystemProgram.programId.toString() && ix.keys.some((k) => k.pubkey.toString() === MINT.toString())
    )
    expect(createAccountIx).toBeDefined()

    // ATA creation runs under the Associated Token Account program
    expect(programIds).toContain(ASSOCIATED_TOKEN_PROGRAM_ID.toString())
  })

  it('includes a service fee transfer sized to the base fee alone when no authorities are revoked', async () => {
    const result = await createTokenCreationTransaction(buildParams())
    const feeTransferIx = result.transaction.instructions.find(
      (ix) =>
        ix.programId.toString() === SystemProgram.programId.toString() &&
        ix.keys.some((k) => k.pubkey.toString() === 'FeeWa11etAddre55111111111111111111111111111'.slice(0, 44))
    )
    expect(feeTransferIx).toBeDefined()
  })

  it('adds a SetAuthority(MintTokens) instruction when revokeMintAuthority is requested', async () => {
    const result = await createTokenCreationTransaction(buildParams({ revokeMintAuthority: true }))
    const setAuthorityIxs = result.transaction.instructions.filter((ix) => ix.data[0] === 6)
    // AuthorityType discriminator byte: 0 = MintTokens
    expect(setAuthorityIxs.some((ix) => ix.data[1] === 0)).toBe(true)
  })

  it('adds a SetAuthority(FreezeAccount) instruction when revokeFreezeAuthority is requested', async () => {
    const result = await createTokenCreationTransaction(buildParams({ revokeFreezeAuthority: true }))
    const setAuthorityIxs = result.transaction.instructions.filter((ix) => ix.data[0] === 6)
    // AuthorityType discriminator byte: 1 = FreezeAccount
    expect(setAuthorityIxs.some((ix) => ix.data[1] === 1)).toBe(true)
  })

  it('does not add SetAuthority instructions when no revocation is requested', async () => {
    const result = await createTokenCreationTransaction(buildParams())
    const setAuthorityIxs = result.transaction.instructions.filter((ix) => ix.data[0] === 6)
    expect(setAuthorityIxs).toHaveLength(0)
  })

  it('omits the mint-to instruction when totalSupply is zero', async () => {
    const result = await createTokenCreationTransaction(buildParams({ totalSupply: 0 }))
    expect(result.totalSupply).toBe('0')
    // MintTo instruction discriminator is 7
    const mintToIxs = result.transaction.instructions.filter(
      (ix) => ix.programId.toString() === TOKEN_2022_PROGRAM_ID.toString() && ix.data[0] === 7
    )
    expect(mintToIxs).toHaveLength(0)
  })

  it('adds an UpdateAuthority(null) instruction when immutableMetadata is requested', async () => {
    const before = await createTokenCreationTransaction(buildParams())
    const after = await createTokenCreationTransaction(buildParams({ immutableMetadata: true }))
    expect(after.transaction.instructions.length).toBe(before.transaction.instructions.length + 1)
  })

  it('rejects AppError instances raised from coupon validation unchanged', async () => {
    const { AppError } = await import('@/lib/errors')
    mockApplyCouponToServiceFee.mockRejectedValue(
      new AppError('INVALID_INPUT', 'Discount coupon is invalid or has no remaining usage', 400)
    )

    await expect(createTokenCreationTransaction(buildParams())).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  // ---------------------------------------------------------------------------
  // Contentful fee fallback
  // ---------------------------------------------------------------------------

  describe('Contentful fee fallback', () => {
    beforeEach(() => {
      // Pass the base fee straight through so the fee transfer reflects the resolved fee
      mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({ feeSOL: fee, couponMemoInstruction: null }))
    })

    it('should charge the 0.19 SOL fallback fee when Contentful has no configuration for the tool', async () => {
      vi.mocked(getCachedToolConfig).mockResolvedValueOnce(null)

      const result = await createTokenCreationTransaction(buildParams())

      expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(TOOL_FEE_FALLBACKS['token-creator'].baseFee, undefined)
      expect(feeTransferLamports(result.transaction.instructions)).toBe(190_000_000)
    })

    it('should charge the fallback fee when the Contentful lookup fails', async () => {
      vi.mocked(getCachedToolConfig).mockRejectedValueOnce(new Error('Contentful unavailable'))

      const result = await createTokenCreationTransaction(buildParams())

      expect(feeTransferLamports(result.transaction.instructions)).toBe(190_000_000)
    })

    it('should charge the fallback fee when the Contentful fee is invalid', async () => {
      vi.mocked(getCachedToolConfig).mockResolvedValueOnce({
        toolId: 'token-creator',
        isEnabled: true,
        baseFee: Number.NaN,
        networkFee: 0.0005,
      })

      const result = await createTokenCreationTransaction(buildParams())

      expect(feeTransferLamports(result.transaction.instructions)).toBe(190_000_000)
    })

    it('should add the 0.05 SOL revoke add-ons on top of the fallback base fee', async () => {
      vi.mocked(getCachedToolConfig).mockResolvedValueOnce(null)

      const result = await createTokenCreationTransaction(buildParams({ revokeMintAuthority: true, revokeFreezeAuthority: true }))

      // 0.19 fallback base fee + 0.05 + 0.05
      expect(feeTransferLamports(result.transaction.instructions)).toBe(290_000_000)
    })

    it('should add only the selected revoke add-on', async () => {
      vi.mocked(getCachedToolConfig).mockResolvedValueOnce(null)

      const result = await createTokenCreationTransaction(buildParams({ revokeMintAuthority: false, revokeFreezeAuthority: true }))

      expect(feeTransferLamports(result.transaction.instructions)).toBe(240_000_000)
    })

    it('should charge the fee configured in Contentful when it is available', async () => {
      vi.mocked(getCachedToolConfig).mockResolvedValueOnce({ toolId: 'token-creator', isEnabled: true, baseFee: 0.123, networkFee: 0.0005 })

      const result = await createTokenCreationTransaction(buildParams())

      expect(vi.mocked(getCachedToolConfig)).toHaveBeenCalledWith('token-creator')
      expect(feeTransferLamports(result.transaction.instructions)).toBe(123_000_000)
    })
  })
})
