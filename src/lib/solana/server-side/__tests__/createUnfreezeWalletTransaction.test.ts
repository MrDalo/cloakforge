import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'
import { feeTransferLamports, versionedInstructions } from '@/__tests__/utils/feeTestHelpers'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { Keypair, PublicKey, TransactionMessage, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TokenAccountNotFoundError, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { createBatchUnfreezeTransaction } from '../createUnfreezeWalletTransaction'

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
  getCachedToolConfig: vi.fn().mockResolvedValue({ baseFee: 0.01 }),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

vi.mock('@solana/spl-token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/spl-token')>()
  return {
    ...actual,
    getMint: (...args: unknown[]) => mockGetMint(...args),
    getAccount: (...args: unknown[]) => mockGetAccount(...args),
  }
})

let mockGetMint: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
let mockGetAccount: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
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
const MINT = Keypair.generate().publicKey
const TARGET_1 = Keypair.generate().publicKey
const TARGET_2 = Keypair.generate().publicKey

const ata = (wallet: PublicKey, tokenProgramId: PublicKey = TOKEN_PROGRAM_ID) =>
  getAssociatedTokenAddressSync(MINT, wallet, false, tokenProgramId)

describe('createBatchUnfreezeTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.01, couponMemoInstruction: null })
    mockGetAccountInfo = vi.fn().mockResolvedValue({ owner: TOKEN_PROGRAM_ID })
    mockGetMint = vi.fn().mockResolvedValue({ freezeAuthority: WALLET })
    mockGetAccount = vi.fn().mockResolvedValue({ isFrozen: true })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'test-blockhash-1234', lastValidBlockHeight: 999 })
  })

  it('builds a single versioned transaction unfreezing both wallets', async () => {
    const result = await createBatchUnfreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: [TARGET_1, TARGET_2],
      mintAddress: MINT,
    })

    expect(result.transactions).toHaveLength(1)
    expect(result.unfrozenWallets.sort()).toEqual([TARGET_1.toString(), TARGET_2.toString()].sort())
    expect(result.derivedTokenAccounts.sort()).toEqual([ata(TARGET_1).toString(), ata(TARGET_2).toString()].sort())

    const decompiled = TransactionMessage.decompile(result.transactions[0].message)
    // [computeUnitLimit, computeUnitPrice, serviceMemo, feeTransfer, thaw x2]
    expect(decompiled.instructions).toHaveLength(6)
    expect(decompiled.instructions[4].programId.toString()).toBe(TOKEN_PROGRAM_ID.toString())
    expect(decompiled.instructions[5].programId.toString()).toBe(TOKEN_PROGRAM_ID.toString())
  })

  it('splits into multiple transactions when wallet count exceeds the per-tx max', async () => {
    const targets = Array.from({ length: 12 }, () => Keypair.generate().publicKey)

    const result = await createBatchUnfreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: targets,
      mintAddress: MINT,
    })

    expect(result.transactions).toHaveLength(2)
    expect(result.unfrozenWallets).toHaveLength(12)
  })

  it('skips wallets that are already unfrozen', async () => {
    mockGetAccount.mockImplementation(async (_conn: unknown, tokenAccountArg: unknown) => {
      const tokenAccount = tokenAccountArg as PublicKey
      if (tokenAccount.toString() === ata(TARGET_1).toString()) return { isFrozen: false }
      return { isFrozen: true }
    })

    const result = await createBatchUnfreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: [TARGET_1, TARGET_2],
      mintAddress: MINT,
    })

    expect(result.unfrozenWallets).toEqual([TARGET_2.toString()])
  })

  it('skips wallets with no token account for this mint', async () => {
    mockGetAccount.mockImplementation(async (_conn: unknown, tokenAccountArg: unknown) => {
      const tokenAccount = tokenAccountArg as PublicKey
      if (tokenAccount.toString() === ata(TARGET_1).toString()) {
        throw new TokenAccountNotFoundError()
      }
      return { isFrozen: true }
    })

    const result = await createBatchUnfreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: [TARGET_1, TARGET_2],
      mintAddress: MINT,
    })

    expect(result.unfrozenWallets).toEqual([TARGET_2.toString()])
  })

  it('includes a service fee transfer scaled by wallet count in the chunk', async () => {
    const result = await createBatchUnfreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: [TARGET_1, TARGET_2],
      mintAddress: MINT,
    })

    const decompiled = TransactionMessage.decompile(result.transactions[0].message)
    expect(decompiled.instructions[3].programId.toString()).toBe(SystemProgram.programId.toString())
  })

  it('rejects an empty wallet list', async () => {
    await expect(createBatchUnfreezeTransaction({ walletPublicKey: WALLET, targetWallets: [], mintAddress: MINT })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it('rejects when the mint account cannot be found', async () => {
    mockGetAccountInfo.mockResolvedValue(null)

    await expect(
      createBatchUnfreezeTransaction({ walletPublicKey: WALLET, targetWallets: [TARGET_1], mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })
  })

  it('rejects when the token has no freeze authority', async () => {
    mockGetMint.mockResolvedValue({ freezeAuthority: null })

    await expect(
      createBatchUnfreezeTransaction({ walletPublicKey: WALLET, targetWallets: [TARGET_1], mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('rejects when the caller is not the freeze authority', async () => {
    mockGetMint.mockResolvedValue({ freezeAuthority: Keypair.generate().publicKey })

    await expect(
      createBatchUnfreezeTransaction({ walletPublicKey: WALLET, targetWallets: [TARGET_1], mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('rejects when no target wallet has a frozen token account for the mint', async () => {
    mockGetAccount.mockResolvedValue({ isFrozen: false })

    await expect(
      createBatchUnfreezeTransaction({ walletPublicKey: WALLET, targetWallets: [TARGET_1], mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  // ---------------------------------------------------------------------------
  // Contentful fee fallback
  // ---------------------------------------------------------------------------

  describe('Contentful fee fallback', () => {
    beforeEach(() => {
      // Pass the base fee straight through so the fee transfer reflects the resolved fee
      mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({ feeSOL: fee, couponMemoInstruction: null }))
    })

    it('should charge the 0.01 SOL per wallet fallback fee when Contentful has no configuration for the tool', async () => {
      vi.mocked(getCachedToolConfig).mockResolvedValueOnce(null)

      const result = await createBatchUnfreezeTransaction({
        walletPublicKey: WALLET,
        targetWallets: [TARGET_1, TARGET_2],
        mintAddress: MINT,
      })

      expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(TOOL_FEE_FALLBACKS['unfreeze-wallets'].baseFee, undefined)
      expect(feeTransferLamports(versionedInstructions(result.transactions))).toBe(2 * 10_000_000)
    })

    it('should charge the fallback fee when the Contentful lookup fails', async () => {
      vi.mocked(getCachedToolConfig).mockRejectedValueOnce(new Error('Contentful unavailable'))

      const result = await createBatchUnfreezeTransaction({
        walletPublicKey: WALLET,
        targetWallets: [TARGET_1, TARGET_2],
        mintAddress: MINT,
      })

      expect(feeTransferLamports(versionedInstructions(result.transactions))).toBe(2 * 10_000_000)
    })

    it('should charge the fallback fee when the Contentful fee is invalid', async () => {
      vi.mocked(getCachedToolConfig).mockResolvedValueOnce({
        toolId: 'unfreeze-wallets',
        isEnabled: true,
        baseFee: Number.NaN,
        networkFee: 0.0005,
      })

      const result = await createBatchUnfreezeTransaction({
        walletPublicKey: WALLET,
        targetWallets: [TARGET_1, TARGET_2],
        mintAddress: MINT,
      })

      expect(feeTransferLamports(versionedInstructions(result.transactions))).toBe(2 * 10_000_000)
    })

    it('should charge the fee configured in Contentful when it is available', async () => {
      vi.mocked(getCachedToolConfig).mockResolvedValueOnce({
        toolId: 'unfreeze-wallets',
        isEnabled: true,
        baseFee: 0.123,
        networkFee: 0.0005,
      })

      const result = await createBatchUnfreezeTransaction({
        walletPublicKey: WALLET,
        targetWallets: [TARGET_1, TARGET_2],
        mintAddress: MINT,
      })

      expect(vi.mocked(getCachedToolConfig)).toHaveBeenCalledWith('unfreeze-wallets')
      expect(feeTransferLamports(versionedInstructions(result.transactions))).toBe(2 * 123_000_000)
    })
  })
})
