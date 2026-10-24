import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, PACKET_DATA_SIZE, PublicKey, TransactionMessage, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  MintLayout,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { createMultisenderTransaction, MAX_RECIPIENTS_PER_TRANSACTION, MAX_TRANSACTION_SIZE } from '../createMultisenderTransaction'

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

const mockGetCachedToolConfig = vi.hoisted(() => vi.fn())
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: (...args: unknown[]) => mockGetCachedToolConfig(...args),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

let mockGetAccountInfo: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
let mockGetLatestBlockhash: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  return {
    ...actual,
    createConnectionPair: vi.fn(() => ({
      legacyConnection: {
        getLatestBlockhash: (...args: unknown[]) => mockGetLatestBlockhash(...args),
        getAccountInfo: (...args: unknown[]) => mockGetAccountInfo(...args),
      },
      kitRpc: {},
    })),
    calculateDynamicPriorityFee: vi.fn().mockResolvedValue(1500),
  }
})

const TRANSFER_CHECKED_DISCRIMINATOR = 12
const WALLET_KEYPAIR = Keypair.generate()
const WALLET = WALLET_KEYPAIR.publicKey
const MINT = Keypair.generate().publicKey

/** Builds a real on-chain mint account (82-byte MintLayout) owned by the given token program. */
const makeMintAccount = (decimals: number, owner: PublicKey = TOKEN_PROGRAM_ID, isInitialized = true) => {
  const data = Buffer.alloc(MINT_SIZE)
  MintLayout.encode(
    {
      mintAuthorityOption: 0,
      mintAuthority: PublicKey.default,
      supply: BigInt(0),
      decimals,
      isInitialized,
      freezeAuthorityOption: 0,
      freezeAuthority: PublicKey.default,
    },
    data
  )
  return { data, owner, lamports: 1_461_600, executable: false, rentEpoch: 0 }
}

const makeRecipients = (n: number, amount: number | string = 1) =>
  Array.from({ length: n }, () => ({ address: Keypair.generate().publicKey.toString(), amount }))

const decompile = (result: Awaited<ReturnType<typeof createMultisenderTransaction>>, index = 0): TransactionInstruction[] =>
  TransactionMessage.decompile(result.transactions[index].message).instructions

const transferCheckedOf = (ix: TransactionInstruction) => ({
  discriminator: ix.data[0],
  amount: ix.data.readBigUInt64LE(1),
  decimals: ix.data[9],
})

describe('createMultisenderTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCachedToolConfig.mockResolvedValue({ baseFee: 0.001 })
    // Pass the base fee straight through (no coupon)
    mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({ feeSOL: fee, couponInstructions: [] }))
    mockGetAccountInfo = vi.fn().mockResolvedValue(makeMintAccount(6))
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString(), lastValidBlockHeight: 999 })
  })

  it('should build a single SOL transaction for a small recipient list', async () => {
    const recipients = makeRecipients(3)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients })

    expect(result.transactions).toHaveLength(1)
    const instructions = decompile(result)
    // [computeLimit, computePrice, serviceMemo, feeTransfer, transfer x3]
    expect(instructions).toHaveLength(7)
    for (let i = 4; i < 7; i++) {
      expect(instructions[i].programId.toString()).toBe(SystemProgram.programId.toString())
    }
    expect(mockGetAccountInfo).not.toHaveBeenCalled()
  })

  it('should convert SOL amounts to exact lamports', async () => {
    const result = await createMultisenderTransaction({
      walletPublicKey: WALLET,
      recipients: [{ address: Keypair.generate().publicKey.toString(), amount: '1.000000001' }],
    })
    const transferIx = decompile(result)[4]
    // SystemProgram transfer layout: u32 instruction index, u64 lamports
    expect(transferIx.data.readBigUInt64LE(4)).toBe(BigInt(1_000_000_001))
  })

  it('should split recipients exceeding MAX_RECIPIENTS_PER_TRANSACTION (10) into multiple transactions', async () => {
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: makeRecipients(12) })
    expect(result.transactions).toHaveLength(2)
  })

  it('should build TransferChecked with idempotent ATA creation for the classic Token program', async () => {
    const result = await createMultisenderTransaction({
      walletPublicKey: WALLET,
      tokenMintAddress: MINT,
      recipients: makeRecipients(2, 10),
    })

    const instructions = decompile(result)
    // [computeLimit, computePrice, serviceMemo, feeTransfer, (createATA + transferChecked) x2] = 8
    expect(instructions).toHaveLength(8)
    expect(instructions[4].programId.toString()).toBe(ASSOCIATED_TOKEN_PROGRAM_ID.toString())

    const transferIx = instructions[5]
    expect(transferIx.programId.toString()).toBe(TOKEN_PROGRAM_ID.toString())
    // TransferChecked key order: [source, mint, destination, authority]
    const sourceATA = getAssociatedTokenAddressSync(MINT, WALLET, false, TOKEN_PROGRAM_ID)
    expect(transferIx.keys[0].pubkey.toString()).toBe(sourceATA.toString())
    expect(transferIx.keys[1].pubkey.toString()).toBe(MINT.toString())
    expect(transferIx.keys[3].pubkey.toString()).toBe(WALLET.toString())
    expect(transferIx.keys[3].isSigner).toBe(true)

    expect(transferCheckedOf(transferIx)).toEqual({
      discriminator: TRANSFER_CHECKED_DISCRIMINATOR,
      amount: BigInt(10_000_000),
      decimals: 6,
    })
  })

  it.each([0, 6, 9])('should scale with the on-chain decimals (%i)', async (onChainDecimals) => {
    mockGetAccountInfo.mockResolvedValue(makeMintAccount(onChainDecimals))

    const result = await createMultisenderTransaction({
      walletPublicKey: WALLET,
      tokenMintAddress: MINT,
      recipients: makeRecipients(1, 3),
    })

    expect(transferCheckedOf(decompile(result)[5])).toEqual({
      discriminator: TRANSFER_CHECKED_DISCRIMINATOR,
      amount: BigInt(3) * BigInt(10) ** BigInt(onChainDecimals),
      decimals: onChainDecimals,
    })
  })

  it('should use TOKEN_2022_PROGRAM_ID and TransferChecked when the mint is owned by Token-2022', async () => {
    mockGetAccountInfo.mockResolvedValue(makeMintAccount(6, TOKEN_2022_PROGRAM_ID))

    const result = await createMultisenderTransaction({
      walletPublicKey: WALLET,
      tokenMintAddress: MINT,
      recipients: makeRecipients(1, '2.5'),
    })
    const transferIx = decompile(result)[5]

    expect(transferIx.programId.toString()).toBe(TOKEN_2022_PROGRAM_ID.toString())
    expect(transferIx.keys[0].pubkey.toString()).toBe(getAssociatedTokenAddressSync(MINT, WALLET, false, TOKEN_2022_PROGRAM_ID).toString())
    expect(transferCheckedOf(transferIx)).toEqual({ discriminator: TRANSFER_CHECKED_DISCRIMINATOR, amount: BigInt(2_500_000), decimals: 6 })
  })

  it('should convert "1.000001" with 6 decimals to exactly 1000001 base units', async () => {
    const result = await createMultisenderTransaction({
      walletPublicKey: WALLET,
      tokenMintAddress: MINT,
      recipients: makeRecipients(1, '1.000001'),
    })
    expect(transferCheckedOf(decompile(result)[5]).amount).toBe(BigInt(1_000_001))
  })

  it('should reject amounts with more fractional digits than the mint decimals', async () => {
    await expect(
      createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients: makeRecipients(1, '1.0000001') })
    ).rejects.toMatchObject({ code: 'INVALID_AMOUNT', message: expect.stringContaining('Recipient #1') })
  })

  it('should reject amounts that overflow u64', async () => {
    mockGetAccountInfo.mockResolvedValue(makeMintAccount(0))
    await expect(
      createMultisenderTransaction({
        walletPublicKey: WALLET,
        tokenMintAddress: MINT,
        recipients: makeRecipients(1, '18446744073709551616'),
      })
    ).rejects.toMatchObject({ code: 'AMOUNT_TOO_LARGE' })
  })

  it('should reject non-positive amounts', async () => {
    await expect(createMultisenderTransaction({ walletPublicKey: WALLET, recipients: makeRecipients(1, 0) })).rejects.toMatchObject({
      code: 'INVALID_AMOUNT',
    })
  })

  it('should reject duplicate recipient addresses before any RPC call', async () => {
    const duplicate = Keypair.generate().publicKey.toString()
    const recipients = [
      { address: duplicate, amount: 1 },
      { address: Keypair.generate().publicKey.toString(), amount: 2 },
      { address: duplicate, amount: 3 },
    ]

    await expect(createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      message: expect.stringContaining('Duplicate recipient address'),
    })
    expect(mockGetAccountInfo).not.toHaveBeenCalled()
    expect(mockGetLatestBlockhash).not.toHaveBeenCalled()
  })

  it('should reject when the token mint account does not exist', async () => {
    mockGetAccountInfo.mockResolvedValue(null)
    await expect(
      createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients: makeRecipients(1) })
    ).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })
  })

  it('should reject accounts that are not owned by a token program', async () => {
    mockGetAccountInfo.mockResolvedValue(makeMintAccount(6, SystemProgram.programId))
    await expect(
      createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients: makeRecipients(1) })
    ).rejects.toMatchObject({ code: 'INVALID_MINT' })
  })

  it('should scale the service fee transfer by the number of recipients in each chunk', async () => {
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: makeRecipients(12) })
    // totalServiceFee = 0.001 * 12 recipients
    expect(result.totalServiceFee).toBeCloseTo(0.012, 6)
  })

  it('should charge the hard-coded per-recipient minimum when the tool config is unavailable', async () => {
    mockGetCachedToolConfig.mockResolvedValue(null)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: makeRecipients(3) })

    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(0.001, undefined, WALLET)
    expect(result.totalServiceFee).toBeGreaterThan(0)
    expect(result.totalServiceFee).toBeCloseTo(0.003, 6)
  })

  it('should honor an explicit baseFee of 0 from the tool config', async () => {
    mockGetCachedToolConfig.mockResolvedValue({ baseFee: 0 })
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: makeRecipients(2) })

    // [computeLimit, computePrice, serviceMemo, transfer x2] = 5 (no fee transfer)
    expect(decompile(result)).toHaveLength(5)
    expect(result.totalServiceFee).toBe(0)
  })

  it('should omit the service fee transfer when a coupon reduces the fee to zero', async () => {
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponInstructions: [] })
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: makeRecipients(2) })

    expect(decompile(result)).toHaveLength(5)
    expect(result.totalServiceFee).toBe(0)
  })

  describe('coupon instructions across batches', () => {
    const FEE_WALLET = new PublicKey('FeeWa11etAddre55111111111111111111111111111'.slice(0, 44))
    const MARKER = Keypair.generate().publicKey
    const couponMemo = (): TransactionInstruction =>
      new TransactionInstruction({
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        keys: [],
        data: Buffer.from('coupon:abc'),
      })
    const couponInstructions = (): TransactionInstruction[] => [
      couponMemo(),
      SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: MARKER, lamports: 0 }),
    ]
    const hasCouponMemo = (instructions: TransactionInstruction[]): boolean =>
      instructions.some((ix) => ix.data.toString() === 'coupon:abc')
    const transfersTo = (instructions: TransactionInstruction[], target: PublicKey): bigint[] =>
      instructions
        .filter((ix) => ix.programId.equals(SystemProgram.programId) && ix.keys[1]?.pubkey.equals(target))
        .map((ix) => ix.data.readBigUInt64LE(4))

    it('should tag only the first transaction (one use per request) and discount every batch', async () => {
      mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({ feeSOL: fee / 2, couponInstructions: couponInstructions() }))

      const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: makeRecipients(12), couponCode: 'SAVE50' })

      expect(mockApplyCouponToServiceFee).toHaveBeenCalledTimes(1)
      expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(0.001, 'SAVE50', WALLET)
      expect(result.transactions).toHaveLength(2)
      expect(hasCouponMemo(decompile(result, 0))).toBe(true)
      expect(transfersTo(decompile(result, 0), MARKER)).toEqual([BigInt(0)])
      expect(hasCouponMemo(decompile(result, 1))).toBe(false)
      expect(transfersTo(decompile(result, 1), MARKER)).toEqual([])
      // 0.0005 SOL per recipient: 10 recipients in batch 1, 2 in batch 2
      expect(transfersTo(decompile(result, 0), FEE_WALLET)).toEqual([BigInt(5_000_000)])
      expect(transfersTo(decompile(result, 1), FEE_WALLET)).toEqual([BigInt(1_000_000)])
      expect(result.recipientCounts).toEqual([10, 2])
      expect(result.totalServiceFee).toBeCloseTo(0.006, 9)
    })

    it('should add the memo + marker transfer of a 100% coupon to the first transaction only, with no fee transfers', async () => {
      mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponInstructions: couponInstructions() })

      const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: makeRecipients(12), couponCode: 'FREE00' })

      expect(hasCouponMemo(decompile(result, 0))).toBe(true)
      expect(transfersTo(decompile(result, 0), MARKER)).toEqual([BigInt(0)])
      expect(hasCouponMemo(decompile(result, 1))).toBe(false)
      expect(transfersTo(decompile(result, 1), MARKER)).toEqual([])
      expect(transfersTo(decompile(result, 0), FEE_WALLET)).toEqual([])
      expect(transfersTo(decompile(result, 1), FEE_WALLET)).toEqual([])
      expect(result.totalServiceFee).toBe(0)
    })
  })

  describe('transaction size packing', () => {
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
    const FEE_WALLET = new PublicKey('FeeWa11etAddre55111111111111111111111111111'.slice(0, 44))
    /** Coupon marker address (an extra 32-byte account key in the first transaction) */
    const MARKER = Keypair.generate().publicKey
    /** Same shape as the real coupon memo: `coupon:` + 16 hex chars of HMAC (23 bytes), no accounts. */
    const COUPON_MEMO_TEXT = 'coupon:0123456789abcdef'
    const couponMemo = (text = COUPON_MEMO_TEXT): TransactionInstruction =>
      new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(text) })
    /** The real coupon instructions: memo + 0-lamport transfer to the coupon marker */
    const couponInstructions = (memoText = COUPON_MEMO_TEXT): TransactionInstruction[] => [
      couponMemo(memoText),
      SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: MARKER, lamports: 0 }),
    ]
    const withCoupon = (feeFactor = 0.5): void => {
      mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({
        feeSOL: fee * feeFactor,
        couponInstructions: couponInstructions(),
      }))
    }
    const countCouponMemos = (instructions: TransactionInstruction[]): number =>
      instructions.filter((ix) => ix.programId.equals(MEMO_PROGRAM_ID) && ix.data.toString() === COUPON_MEMO_TEXT).length
    const countMarkerTransfers = (instructions: TransactionInstruction[]): number =>
      instructions.filter((ix) => ix.programId.equals(SystemProgram.programId) && ix.keys[1]?.pubkey.equals(MARKER)).length

    /** Recipient wallet of every transfer, in instruction order (CreateATA owner for SPL, transfer target for SOL). */
    const paidRecipients = (instructions: TransactionInstruction[], isToken: boolean): string[] =>
      isToken
        ? instructions.filter((ix) => ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)).map((ix) => ix.keys[2].pubkey.toString())
        : instructions
            .filter(
              (ix) =>
                ix.programId.equals(SystemProgram.programId) && !ix.keys[1].pubkey.equals(FEE_WALLET) && !ix.keys[1].pubkey.equals(MARKER)
            )
            .map((ix) => ix.keys[1].pubkey.toString())

    /** Coupon instructions (memo + marker transfer) ride in the first transaction only. */
    const expectCouponInFirstTransactionOnly = (result: Result): void => {
      const firstOnly = result.transactions.map((_, index) => (index === 0 ? 1 : 0))
      expect(result.transactions.map((_, index) => countCouponMemos(decompile(result, index)))).toEqual(firstOnly)
      expect(result.transactions.map((_, index) => countMarkerTransfers(decompile(result, index)))).toEqual(firstOnly)
    }

    type Result = Awaited<ReturnType<typeof createMultisenderTransaction>>

    /** Asserts the invariants every multisender response must hold. */
    const expectValidPacking = (result: Result, recipients: { address: string }[], isToken: boolean): void => {
      expect(result.recipientCounts).toHaveLength(result.transactions.length)
      expect(result.recipientCounts.reduce((sum, count) => sum + count, 0)).toBe(recipients.length)

      const paidInOrder: string[] = []
      result.transactions.forEach((transaction, index) => {
        // Full wire size with the real signature in place (the route serializes, the wallet signs)
        transaction.sign([WALLET_KEYPAIR])
        const size = transaction.serialize().length
        expect(size).toBeLessThanOrEqual(MAX_TRANSACTION_SIZE)
        expect(size).toBeLessThanOrEqual(PACKET_DATA_SIZE)
        expect(transaction.signatures).toHaveLength(1)

        const instructions = decompile(result, index)
        const paid = paidRecipients(instructions, isToken)
        expect(paid).toHaveLength(result.recipientCounts[index])
        expect(result.recipientCounts[index]).toBeGreaterThan(0)
        expect(result.recipientCounts[index]).toBeLessThanOrEqual(MAX_RECIPIENTS_PER_TRANSACTION)
        paidInOrder.push(...paid)
      })

      expect(paidInOrder).toEqual(recipients.map((recipient) => recipient.address))
    }

    describe.each([
      ['Token', TOKEN_PROGRAM_ID],
      ['Token-2022', TOKEN_2022_PROGRAM_ID],
    ])('%s', (_label, tokenProgramId) => {
      beforeEach(() => {
        mockGetAccountInfo.mockResolvedValue(makeMintAccount(6, tokenProgramId))
      })

      it.each([1, 9, 10, 25, 100])(
        'should keep every transaction within the size limit for %i recipients with a coupon',
        async (recipientCount) => {
          withCoupon()
          const recipients = makeRecipients(recipientCount, '1.5')

          const result = await createMultisenderTransaction({
            walletPublicKey: WALLET,
            tokenMintAddress: MINT,
            recipients,
            couponCode: 'SAVE50',
          })

          expectValidPacking(result, recipients, true)
          expectCouponInFirstTransactionOnly(result)
          // Greedy packing: every batch but the last is (nearly) full — 7-8 SPL recipients fit in 1200 bytes
          for (const count of result.recipientCounts.slice(0, -1)) {
            expect(count).toBeGreaterThanOrEqual(7)
          }
        }
      )

      it.each([9, 10, 25, 100])(
        'should keep every transaction within the size limit for %i recipients without a coupon',
        async (recipientCount) => {
          const recipients = makeRecipients(recipientCount)

          const result = await createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients })

          expectValidPacking(result, recipients, true)
          expect(result.transactions.length).toBeGreaterThan(1)
        }
      )

      it('should charge each transaction the fee for exactly its own recipients', async () => {
        const recipients = makeRecipients(25)
        const result = await createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients })

        result.transactions.forEach((_, index) => {
          const feeTransfers = decompile(result, index)
            .filter((ix) => ix.programId.equals(SystemProgram.programId) && ix.keys[1].pubkey.equals(FEE_WALLET))
            .map((ix) => ix.data.readBigUInt64LE(4))
          // 0.001 SOL per recipient
          expect(feeTransfers).toEqual([BigInt(result.recipientCounts[index]) * BigInt(1_000_000)])
        })
        expect(result.totalServiceFee).toBeCloseTo(0.025, 9)
      })
    })

    it('should pack 25 SOL recipients into 10 + 10 + 5 within the size limit, coupon in the first transaction only', async () => {
      withCoupon()
      const recipients = makeRecipients(25)

      const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients, couponCode: 'SAVE50' })

      expectValidPacking(result, recipients, false)
      expect(result.recipientCounts).toEqual([10, 10, 5])
      expectCouponInFirstTransactionOnly(result)
    })

    it('should keep a 100% coupon (memo + 0-lamport marker transfer) within the size limit', async () => {
      mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponInstructions: couponInstructions() })
      const recipients = makeRecipients(25)

      const result = await createMultisenderTransaction({
        walletPublicKey: WALLET,
        tokenMintAddress: MINT,
        recipients,
        couponCode: 'FREE00',
      })

      expectValidPacking(result, recipients, true)
      expectCouponInFirstTransactionOnly(result)
      expect(result.totalServiceFee).toBe(0)
    })

    it('should measure the coupon instructions when packing: the first transaction holds fewer recipients than a plain one', async () => {
      const recipients = makeRecipients(40)

      const plain = await createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients })
      withCoupon(1)
      const tagged = await createMultisenderTransaction({
        walletPublicKey: WALLET,
        tokenMintAddress: MINT,
        recipients,
        couponCode: 'SAVE00',
      })

      expectValidPacking(tagged, recipients, true)
      expectCouponInFirstTransactionOnly(tagged)
      // Memo + marker transfer (+ the marker's 32-byte account key) cost one SPL recipient (8 → 7)
      expect(tagged.recipientCounts[0]).toBeLessThan(plain.recipientCounts[0])
      // Only the first transaction carries the extra bytes: later batches pack like the plain ones
      expect(tagged.recipientCounts[1]).toBe(plain.recipientCounts[1])
    })

    it('should throw an AppError (not a RangeError) when not even one recipient fits next to the fixed instructions', async () => {
      // A memo this large leaves no room for a single CreateATA + TransferChecked pair
      mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({
        feeSOL: fee,
        couponInstructions: [couponMemo('x'.repeat(900))],
      }))

      const error = await createMultisenderTransaction({
        walletPublicKey: WALLET,
        tokenMintAddress: MINT,
        recipients: makeRecipients(3),
        couponCode: 'BIG',
      }).catch((caught: unknown) => caught)

      expect(error).not.toBeInstanceOf(RangeError)
      expect(error).toMatchObject({
        name: 'AppError',
        code: 'TRANSACTION_FAILED',
        message: expect.stringContaining('Recipient #1 does not fit'),
      })
    })
  })
})
