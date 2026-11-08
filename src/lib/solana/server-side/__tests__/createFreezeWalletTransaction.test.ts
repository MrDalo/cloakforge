import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, PACKET_DATA_SIZE, PublicKey, TransactionMessage, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TokenAccountNotFoundError, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { createBatchFreezeTransaction } from '../createFreezeWalletTransaction'

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

const WALLET = Keypair.generate().publicKey // freeze authority / fee payer
const MINT = Keypair.generate().publicKey
const TARGET_1 = Keypair.generate().publicKey
const TARGET_2 = Keypair.generate().publicKey

const ata = (wallet: PublicKey, tokenProgramId: PublicKey = TOKEN_PROGRAM_ID) =>
  getAssociatedTokenAddressSync(MINT, wallet, false, tokenProgramId)

describe('createBatchFreezeTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.01, couponInstructions: [] })
    mockGetAccountInfo = vi.fn().mockResolvedValue({ owner: TOKEN_PROGRAM_ID })
    mockGetMint = vi.fn().mockResolvedValue({ freezeAuthority: WALLET })
    mockGetAccount = vi.fn().mockResolvedValue({ isFrozen: false })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'test-blockhash-1234', lastValidBlockHeight: 999 })
  })

  it('builds a single versioned transaction freezing both wallets', async () => {
    const result = await createBatchFreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: [TARGET_1, TARGET_2],
      mintAddress: MINT,
    })

    expect(result.transactions).toHaveLength(1)
    expect(result.frozenWallets.sort()).toEqual([TARGET_1.toString(), TARGET_2.toString()].sort())
    expect(result.derivedTokenAccounts.sort()).toEqual([ata(TARGET_1).toString(), ata(TARGET_2).toString()].sort())
    expect(result.blockhash).toBe('test-blockhash-1234')
    expect(result.lastValidBlockHeight).toBe(999)

    const decompiled = TransactionMessage.decompile(result.transactions[0].message)
    // [computeUnitLimit, computeUnitPrice, serviceMemo, feeTransfer, freeze x2]
    expect(decompiled.instructions).toHaveLength(6)
    const freezeIx1 = decompiled.instructions[4]
    const freezeIx2 = decompiled.instructions[5]
    expect(freezeIx1.programId.toString()).toBe(TOKEN_PROGRAM_ID.toString())
    expect(freezeIx2.programId.toString()).toBe(TOKEN_PROGRAM_ID.toString())
  })

  it('splits into multiple transactions when wallet count exceeds the per-tx max', async () => {
    const targets = Array.from({ length: 12 }, () => Keypair.generate().publicKey)
    mockGetAccount.mockResolvedValue({ isFrozen: false })

    const result = await createBatchFreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: targets,
      mintAddress: MINT,
    })

    // MAX_WALLETS_PER_TRANSACTION = 10 -> 12 wallets = 2 chunks
    expect(result.transactions).toHaveLength(2)
    expect(result.frozenWallets).toHaveLength(12)
  })

  describe('coupon instructions', () => {
    const feeWallet = new PublicKey('FeeWa11etAddre55111111111111111111111111111'.slice(0, 44))
    const marker = Keypair.generate().publicKey
    /** The real coupon instructions: memo + 0-lamport transfer to the coupon marker */
    const couponInstructions = (): TransactionInstruction[] => [
      new TransactionInstruction({
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        keys: [],
        data: Buffer.from('coupon:0123456789abcdef'),
      }),
      SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: marker, lamports: 0 }),
    ]
    const hasCouponMemo = (instructions: TransactionInstruction[]): boolean =>
      instructions.some((ix) => ix.data.toString() === 'coupon:0123456789abcdef')
    const transfersTo = (instructions: TransactionInstruction[], target: PublicKey): bigint[] =>
      instructions
        .filter((ix) => ix.programId.equals(SystemProgram.programId) && ix.keys[1]?.pubkey.equals(target))
        .map((ix) => ix.data.readBigUInt64LE(4))

    const run = async (feeSOL: number) => {
      mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL, couponInstructions: couponInstructions() })
      // A real (base58, 32-byte) blockhash so the transaction can be serialized and measured
      mockGetLatestBlockhash.mockResolvedValue({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 999 })
      const targets = Array.from({ length: 12 }, () => Keypair.generate().publicKey)

      const result = await createBatchFreezeTransaction({
        walletPublicKey: WALLET,
        targetWallets: targets,
        mintAddress: MINT,
        couponCode: 'SAVE50',
      })

      expect(mockApplyCouponToServiceFee).toHaveBeenCalledTimes(1)
      expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(0.01, 'SAVE50', WALLET)
      expect(result.transactions).toHaveLength(2)
      // The first (fullest: 10 wallets + coupon instructions) transaction stays within the packet size
      expect(result.transactions[0].serialize().length).toBeLessThanOrEqual(PACKET_DATA_SIZE)
      return result.transactions.map((tx) => TransactionMessage.decompile(tx.message).instructions)
    }

    it('adds the memo + marker transfer to the first transaction only and discounts every chunk', async () => {
      const [first, second] = await run(0.005)

      expect(hasCouponMemo(first)).toBe(true)
      expect(transfersTo(first, marker)).toEqual([BigInt(0)])
      expect(hasCouponMemo(second)).toBe(false)
      expect(transfersTo(second, marker)).toEqual([])
      // Discounted 0.005 SOL per wallet in both chunks (10 + 2 wallets)
      expect(transfersTo(first, feeWallet)).toEqual([BigInt(50_000_000)])
      expect(transfersTo(second, feeWallet)).toEqual([BigInt(10_000_000)])
    })

    it('adds the memo + marker transfer of a 100% coupon to the first transaction only, with no fee transfers', async () => {
      const [first, second] = await run(0)

      expect(hasCouponMemo(first)).toBe(true)
      expect(transfersTo(first, marker)).toEqual([BigInt(0)])
      expect(hasCouponMemo(second)).toBe(false)
      expect(transfersTo(second, marker)).toEqual([])
      expect(transfersTo(first, feeWallet)).toEqual([])
      expect(transfersTo(second, feeWallet)).toEqual([])
    })
  })

  it('skips wallets that are already frozen', async () => {
    mockGetAccount.mockImplementation(async (_conn: unknown, tokenAccountArg: unknown) => {
      const tokenAccount = tokenAccountArg as PublicKey
      if (tokenAccount.toString() === ata(TARGET_1).toString()) return { isFrozen: true }
      return { isFrozen: false }
    })

    const result = await createBatchFreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: [TARGET_1, TARGET_2],
      mintAddress: MINT,
    })

    expect(result.frozenWallets).toEqual([TARGET_2.toString()])
  })

  it('skips wallets with no token account for this mint', async () => {
    mockGetAccount.mockImplementation(async (_conn: unknown, tokenAccountArg: unknown) => {
      const tokenAccount = tokenAccountArg as PublicKey
      if (tokenAccount.toString() === ata(TARGET_1).toString()) {
        throw new TokenAccountNotFoundError()
      }
      return { isFrozen: false }
    })

    const result = await createBatchFreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: [TARGET_1, TARGET_2],
      mintAddress: MINT,
    })

    expect(result.frozenWallets).toEqual([TARGET_2.toString()])
  })

  it('includes a service fee transfer scaled by wallet count in the chunk', async () => {
    const result = await createBatchFreezeTransaction({
      walletPublicKey: WALLET,
      targetWallets: [TARGET_1, TARGET_2],
      mintAddress: MINT,
    })

    const decompiled = TransactionMessage.decompile(result.transactions[0].message)
    const feeIx = decompiled.instructions[3]
    expect(feeIx.programId.toString()).toBe(SystemProgram.programId.toString())
  })

  it('rejects an empty wallet list', async () => {
    await expect(createBatchFreezeTransaction({ walletPublicKey: WALLET, targetWallets: [], mintAddress: MINT })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it('rejects when the mint account cannot be found', async () => {
    mockGetAccountInfo.mockResolvedValue(null)

    await expect(
      createBatchFreezeTransaction({ walletPublicKey: WALLET, targetWallets: [TARGET_1], mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })
  })

  it('rejects a mint owned by an unrecognized program', async () => {
    mockGetAccountInfo.mockResolvedValue({ owner: Keypair.generate().publicKey })

    await expect(
      createBatchFreezeTransaction({ walletPublicKey: WALLET, targetWallets: [TARGET_1], mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects when the token has no freeze authority', async () => {
    mockGetMint.mockResolvedValue({ freezeAuthority: null })

    await expect(
      createBatchFreezeTransaction({ walletPublicKey: WALLET, targetWallets: [TARGET_1], mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('rejects when the caller is not the freeze authority', async () => {
    mockGetMint.mockResolvedValue({ freezeAuthority: Keypair.generate().publicKey })

    await expect(
      createBatchFreezeTransaction({ walletPublicKey: WALLET, targetWallets: [TARGET_1], mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('rejects when no target wallet holds a token account for the mint', async () => {
    mockGetAccount.mockRejectedValue(new TokenAccountNotFoundError())

    await expect(
      createBatchFreezeTransaction({ walletPublicKey: WALLET, targetWallets: [TARGET_1], mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })
})
