import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, AuthorityType } from '@solana/spl-token'
import { createRevokeFreezeAuthorityTransaction } from '../createRevokeFreezeAuthorityTransaction'

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

describe('createRevokeFreezeAuthorityTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.1, couponMemoInstruction: null })
    mockGetAccountInfo = vi.fn().mockResolvedValue({ owner: TOKEN_PROGRAM_ID })
    mockGetMint = vi.fn().mockResolvedValue({ freezeAuthority: WALLET })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString() })
  })

  it('builds a revoke-freeze-authority transaction for the classic SPL Token program', async () => {
    const result = await createRevokeFreezeAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })

    const { transaction } = result
    expect(transaction.instructions).toHaveLength(5)

    const setAuthorityIx = transaction.instructions[4]
    expect(setAuthorityIx.programId.toString()).toBe(TOKEN_PROGRAM_ID.toString())
    expect(setAuthorityIx.keys[0].pubkey.toString()).toBe(TOKEN.toString())
    expect(setAuthorityIx.keys[1].pubkey.toString()).toBe(WALLET.toString())
    expect(setAuthorityIx.data[0]).toBe(6) // SetAuthority discriminator
    expect(setAuthorityIx.data[1]).toBe(AuthorityType.FreezeAccount)
  })

  it('uses TOKEN_2022_PROGRAM_ID when the token is owned by Token-2022', async () => {
    mockGetAccountInfo.mockResolvedValue({ owner: TOKEN_2022_PROGRAM_ID })

    const result = await createRevokeFreezeAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })
    const setAuthorityIx = result.transaction.instructions[4]
    expect(setAuthorityIx.programId.toString()).toBe(TOKEN_2022_PROGRAM_ID.toString())
  })

  it('includes a service fee transfer when the fee is non-zero', async () => {
    const result = await createRevokeFreezeAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })
    expect(result.transaction.instructions[3].programId.toString()).toBe(SystemProgram.programId.toString())
  })

  it('omits the service fee transfer when the fee resolves to zero', async () => {
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponMemoInstruction: null })
    const result = await createRevokeFreezeAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })
    expect(result.transaction.instructions).toHaveLength(4)
  })

  // Same pre-existing catch-order bug as createRevokeMintAuthorityTransaction.ts — locked in as-is.
  it('rejects when the token account cannot be found (currently reclassified as INVALID_INPUT)', async () => {
    mockGetAccountInfo.mockResolvedValue(null)
    await expect(createRevokeFreezeAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it('rejects a mint owned by an unrecognized program', async () => {
    mockGetAccountInfo.mockResolvedValue({ owner: Keypair.generate().publicKey })
    await expect(createRevokeFreezeAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it('rejects when freeze authority is already revoked', async () => {
    mockGetMint.mockResolvedValue({ freezeAuthority: null })
    await expect(createRevokeFreezeAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects when the wallet is not the current freeze authority', async () => {
    mockGetMint.mockResolvedValue({ freezeAuthority: Keypair.generate().publicKey })
    await expect(createRevokeFreezeAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })
})
