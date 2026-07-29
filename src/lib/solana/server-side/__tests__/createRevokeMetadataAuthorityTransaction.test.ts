import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { createRevokeMetadataAuthorityTransaction } from '../createRevokeMetadataAuthorityTransaction'

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

describe('createRevokeMetadataAuthorityTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCachedToolConfig.mockResolvedValue({ baseFee: 0.1 })
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.1, couponMemoInstruction: null })
    mockGetAccountInfo = vi.fn().mockResolvedValue({ owner: TOKEN_2022_PROGRAM_ID })
    mockGetTokenMetadata = vi.fn().mockResolvedValue({
      updateAuthority: WALLET,
      mint: TOKEN,
      name: 'Test Token',
      symbol: 'TST',
      uri: 'https://example.com/metadata.json',
      additionalMetadata: [],
    })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString() })
  })

  it('rejects a mint that is not owned by TOKEN_2022_PROGRAM_ID', async () => {
    mockGetAccountInfo.mockResolvedValue({ owner: TOKEN_PROGRAM_ID })
    await expect(createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it('rejects when on-chain metadata has no update authority (already immutable)', async () => {
    mockGetTokenMetadata.mockResolvedValue({
      updateAuthority: null,
      mint: TOKEN,
      name: 'Test Token',
      symbol: 'TST',
      uri: '',
      additionalMetadata: [],
    })
    await expect(createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects when the wallet is not the current metadata update authority', async () => {
    mockGetTokenMetadata.mockResolvedValue({
      updateAuthority: Keypair.generate().publicKey,
      mint: TOKEN,
      name: 'Test Token',
      symbol: 'TST',
      uri: '',
      additionalMetadata: [],
    })
    await expect(createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('builds a revoke-metadata-authority transaction on the happy path', async () => {
    const result = await createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })
    const { transaction } = result

    expect(transaction.instructions.length).toBeGreaterThan(0)
    // [computeLimit, computePrice, serviceMemo, feeTransfer, revokeMetadataAuthority]
    expect(transaction.instructions).toHaveLength(5)

    const revokeIx = transaction.instructions[4]
    expect(revokeIx.programId.toString()).toBe(TOKEN_2022_PROGRAM_ID.toString())
    expect(revokeIx.keys[0].pubkey.toString()).toBe(TOKEN.toString())
    expect(revokeIx.keys[1].pubkey.toString()).toBe(WALLET.toString())
  })

  it('falls back to the default base fee when tool config lookup fails, and still builds a valid transaction', async () => {
    mockGetCachedToolConfig.mockRejectedValue(new Error('contentful down'))

    const result = await createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })

    expect(result.transaction.instructions.length).toBeGreaterThan(0)
    expect(() => result.transaction.serialize({ requireAllSignatures: false })).not.toThrow()
  })
})
