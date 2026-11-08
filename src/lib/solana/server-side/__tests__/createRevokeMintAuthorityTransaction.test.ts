import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, AuthorityType } from '@solana/spl-token'
import { createRevokeMintAuthorityTransaction } from '../createRevokeMintAuthorityTransaction'
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

vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn().mockResolvedValue({ baseFee: 0.1 }),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

vi.mock('@solana/spl-token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/spl-token')>()
  return { ...actual, getMint: (...args: unknown[]) => mockGetMint(...args) }
})

let mockGetMint: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
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

describe('createRevokeMintAuthorityTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.1, couponInstructions: [] })
    mockGetAccountInfo = vi.fn().mockResolvedValue({ owner: TOKEN_PROGRAM_ID })
    mockGetMint = vi.fn().mockResolvedValue({ mintAuthority: WALLET })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString() })
  })

  it('builds a revoke-mint-authority transaction for the classic SPL Token program', async () => {
    const result = await createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })

    const { transaction } = result
    // [computeLimit, computePrice, serviceMemo, feeTransfer, setAuthority]
    expect(transaction.instructions).toHaveLength(5)

    const setAuthorityIx = transaction.instructions[4]
    expect(setAuthorityIx.programId.toString()).toBe(TOKEN_PROGRAM_ID.toString())
    expect(setAuthorityIx.keys[0].pubkey.toString()).toBe(TOKEN.toString())
    expect(setAuthorityIx.keys[1].pubkey.toString()).toBe(WALLET.toString())
    // data[0] = SetAuthority instruction discriminator (6), data[1] = AuthorityType
    expect(setAuthorityIx.data[0]).toBe(6)
    expect(setAuthorityIx.data[1]).toBe(AuthorityType.MintTokens)
  })

  it('uses TOKEN_2022_PROGRAM_ID when the token is owned by Token-2022', async () => {
    mockGetAccountInfo.mockResolvedValue({ owner: TOKEN_2022_PROGRAM_ID })

    const result = await createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })
    const setAuthorityIx = result.transaction.instructions[4]
    expect(setAuthorityIx.programId.toString()).toBe(TOKEN_2022_PROGRAM_ID.toString())
  })

  it('includes a service fee transfer when the fee is non-zero', async () => {
    const result = await createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })
    expect(result.transaction.instructions[3].programId.toString()).toBe(SystemProgram.programId.toString())
  })

  it('omits the service fee transfer when the fee resolves to zero', async () => {
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponInstructions: [] })
    const result = await createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })
    expect(result.transaction.instructions).toHaveLength(4)
  })

  // The outer catch re-throws AppError instances before its message-pattern remapping, so
  // TOKEN_NOT_FOUND's message ("...or invalid token address") is no longer reclassified.
  it('rejects when the token account cannot be found with TOKEN_NOT_FOUND', async () => {
    mockGetAccountInfo.mockResolvedValue(null)
    await expect(createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'TOKEN_NOT_FOUND',
    })
  })

  it('passes the coupon code and payer, and surfaces coupon errors unchanged', async () => {
    mockApplyCouponToServiceFee.mockRejectedValue(new AppError('INVALID_INPUT', 'Discount coupon is invalid or no longer available', 400))

    await expect(
      createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN, couponCode: 'SAVE10' })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT', message: 'Discount coupon is invalid or no longer available' })
    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(expect.any(Number), 'SAVE10', WALLET)
  })

  it('rejects a mint owned by an unrecognized program', async () => {
    mockGetAccountInfo.mockResolvedValue({ owner: Keypair.generate().publicKey })
    await expect(createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it('rejects when mint authority is already revoked', async () => {
    mockGetMint.mockResolvedValue({ mintAuthority: null })
    await expect(createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects when the wallet is not the current mint authority', async () => {
    mockGetMint.mockResolvedValue({ mintAuthority: Keypair.generate().publicKey })
    await expect(createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })
})
