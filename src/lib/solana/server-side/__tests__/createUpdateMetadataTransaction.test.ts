import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { createUpdateMetadataTransaction } from '../createUpdateMetadataTransaction'
import { AppError } from '@/lib/errors'

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
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.1, couponInstructions: [] })
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

  it('passes the coupon code and payer, and surfaces coupon errors unchanged', async () => {
    mockApplyCouponToServiceFee.mockRejectedValue(new AppError('INVALID_INPUT', 'Discount coupon is invalid or no longer available', 400))

    await expect(
      createUpdateMetadataTransaction({
        walletPublicKey: WALLET,
        tokenPublicKey: TOKEN,
        tokenData: { name: 'New Name' },
        couponCode: 'SAVE10',
      })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT', message: 'Discount coupon is invalid or no longer available' })
    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(expect.any(Number), 'SAVE10', WALLET)
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
})
