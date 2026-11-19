import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'
import { feeTransferLamports } from '@/__tests__/utils/feeTestHelpers'
import { Keypair } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { createUpdateMetadataTransaction } from '../createUpdateMetadataTransaction'

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

const mockGetCachedToolConfig = vi.fn()
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: (...args: unknown[]) => mockGetCachedToolConfig(...args),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

let mockGetTokenMetadata: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
vi.mock('@solana/spl-token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/spl-token')>()
  return { ...actual, getTokenMetadata: (...args: unknown[]) => mockGetTokenMetadata(...args) }
})

let mockGetAccountInfo: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
let mockGetLatestBlockhash: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  return {
    ...actual,
    createConnectionPair: vi.fn(() => ({
      legacyConnection: {
        getAccountInfo: (...args: unknown[]) => mockGetAccountInfo(...args),
        getLatestBlockhash: (...args: unknown[]) => mockGetLatestBlockhash(...args),
      },
      kitRpc: {},
    })),
    calculateDynamicPriorityFee: vi.fn().mockResolvedValue(1500),
  }
})

const WALLET = Keypair.generate().publicKey
const TOKEN = Keypair.generate().publicKey

const CURRENT_NAME = 'Test Token'
const CURRENT_SYMBOL = 'TST'
const CURRENT_URI = 'https://example.com/metadata.json'

describe('createUpdateMetadataTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCachedToolConfig.mockResolvedValue({ baseFee: 0.1 })
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.1, couponMemoInstruction: null })
    mockGetAccountInfo = vi.fn().mockResolvedValue({ owner: TOKEN_2022_PROGRAM_ID })
    mockGetTokenMetadata = vi.fn().mockResolvedValue({
      updateAuthority: WALLET,
      mint: TOKEN,
      name: CURRENT_NAME,
      symbol: CURRENT_SYMBOL,
      uri: CURRENT_URI,
      additionalMetadata: [],
    })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString() })
  })

  it('rejects a mint that is not owned by TOKEN_2022_PROGRAM_ID', async () => {
    mockGetAccountInfo.mockResolvedValue({ owner: TOKEN_PROGRAM_ID })
    await expect(
      createUpdateMetadataTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN, tokenData: { name: 'New Name' } })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects when on-chain metadata is null', async () => {
    mockGetTokenMetadata.mockResolvedValue(null)
    await expect(
      createUpdateMetadataTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN, tokenData: { name: 'New Name' } })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects when the wallet is not the current metadata update authority', async () => {
    mockGetTokenMetadata.mockResolvedValue({
      updateAuthority: Keypair.generate().publicKey,
      mint: TOKEN,
      name: CURRENT_NAME,
      symbol: CURRENT_SYMBOL,
      uri: CURRENT_URI,
      additionalMetadata: [],
    })
    await expect(
      createUpdateMetadataTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN, tokenData: { name: 'New Name' } })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('rejects when no fields actually changed', async () => {
    await expect(
      createUpdateMetadataTransaction({
        walletPublicKey: WALLET,
        tokenPublicKey: TOKEN,
        tokenData: { name: CURRENT_NAME, symbol: CURRENT_SYMBOL },
      })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('builds a transaction with a single field-update instruction when only the name changes', async () => {
    const result = await createUpdateMetadataTransaction({
      walletPublicKey: WALLET,
      tokenPublicKey: TOKEN,
      tokenData: { name: 'New Name' },
    })

    const { transaction } = result
    // [computeLimit, computePrice, serviceMemo, feeTransfer, updateName]
    expect(transaction.instructions).toHaveLength(5)

    const updateIx = transaction.instructions[4]
    expect(updateIx.programId.toString()).toBe(TOKEN_2022_PROGRAM_ID.toString())
    expect(updateIx.keys[0].pubkey.toString()).toBe(TOKEN.toString())
    expect(updateIx.keys[1].pubkey.toString()).toBe(WALLET.toString())
  })

  it('builds a transaction with multiple field-update instructions when name, symbol, and metadataUri all change', async () => {
    const result = await createUpdateMetadataTransaction({
      walletPublicKey: WALLET,
      tokenPublicKey: TOKEN,
      tokenData: { name: 'New Name', symbol: 'NEW' },
      metadataUri: 'https://example.com/new-metadata.json',
    })

    const { transaction } = result
    // [computeLimit, computePrice, serviceMemo, feeTransfer, updateName, updateSymbol, updateUri]
    expect(transaction.instructions).toHaveLength(7)

    const fieldUpdateIxs = transaction.instructions.slice(4)
    expect(fieldUpdateIxs).toHaveLength(3)
    for (const ix of fieldUpdateIxs) {
      expect(ix.programId.toString()).toBe(TOKEN_2022_PROGRAM_ID.toString())
      expect(ix.keys[0].pubkey.toString()).toBe(TOKEN.toString())
    }
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
      mockGetCachedToolConfig.mockResolvedValueOnce(null)

      const result = await createUpdateMetadataTransaction({
        walletPublicKey: WALLET,
        tokenPublicKey: TOKEN,
        tokenData: { name: 'New Name' },
      })

      expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(TOOL_FEE_FALLBACKS['update-metadata'].baseFee, undefined)
      expect(feeTransferLamports(result.transaction.instructions)).toBe(190_000_000)
    })

    it('should charge the fallback fee when the Contentful lookup fails', async () => {
      mockGetCachedToolConfig.mockRejectedValueOnce(new Error('Contentful unavailable'))

      const result = await createUpdateMetadataTransaction({
        walletPublicKey: WALLET,
        tokenPublicKey: TOKEN,
        tokenData: { name: 'New Name' },
      })

      expect(feeTransferLamports(result.transaction.instructions)).toBe(190_000_000)
    })

    it('should charge the fallback fee when the Contentful fee is invalid', async () => {
      mockGetCachedToolConfig.mockResolvedValueOnce({ toolId: 'update-metadata', isEnabled: true, baseFee: Number.NaN, networkFee: 0.0005 })

      const result = await createUpdateMetadataTransaction({
        walletPublicKey: WALLET,
        tokenPublicKey: TOKEN,
        tokenData: { name: 'New Name' },
      })

      expect(feeTransferLamports(result.transaction.instructions)).toBe(190_000_000)
    })

    it('should charge the fee configured in Contentful when it is available', async () => {
      mockGetCachedToolConfig.mockResolvedValueOnce({ toolId: 'update-metadata', isEnabled: true, baseFee: 0.123, networkFee: 0.0005 })

      const result = await createUpdateMetadataTransaction({
        walletPublicKey: WALLET,
        tokenPublicKey: TOKEN,
        tokenData: { name: 'New Name' },
      })

      expect(mockGetCachedToolConfig).toHaveBeenCalledWith('update-metadata')
      expect(feeTransferLamports(result.transaction.instructions)).toBe(123_000_000)
    })
  })
})
