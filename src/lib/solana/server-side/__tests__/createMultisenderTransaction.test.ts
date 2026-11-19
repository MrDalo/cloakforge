import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  Keypair,
  PublicKey,
  TransactionMessage,
  SystemProgram,
  SystemInstruction,
  ComputeBudgetProgram,
  ComputeBudgetInstruction,
  TransactionInstruction,
  PACKET_DATA_SIZE,
  type VersionedTransaction,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  decodeTransferCheckedInstruction,
} from '@solana/spl-token'
import { AppError } from '@/lib/errors'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { calculateDynamicPriorityFee } from '@/lib/solana'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'
import {
  createMultisenderTransaction,
  MAX_RECIPIENTS_PER_TRANSACTION,
  type CreateMultisenderTransactionResult,
} from '../createMultisenderTransaction'

const DEFAULT_SERVICE_FEE_SOL = TOOL_FEE_FALLBACKS['transaction-multisender'].baseFee

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
  getCachedToolConfig: vi.fn().mockResolvedValue({ baseFee: 0.001 }),
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
let mockGetLatestBlockhash: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  return {
    ...actual,
    createConnectionPair: vi.fn(() => ({
      legacyConnection: { getLatestBlockhash: (...args: unknown[]) => mockGetLatestBlockhash(...args) },
      kitRpc: {},
    })),
    calculateDynamicPriorityFee: vi.fn().mockResolvedValue(1500),
  }
})

// ---------------------------------------------------------------------------
// Fixtures & helpers
// ---------------------------------------------------------------------------

const WALLET = Keypair.generate().publicKey
const MINT = Keypair.generate().publicKey
const BLOCKHASH = Keypair.generate().publicKey.toString()
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
const FEE_WALLET = new PublicKey('FeeWa11etAddre55111111111111111111111111111')

/** On-chain decimals reported by the (mocked) mint — deliberately different from what clients might assume */
const MINT_DECIMALS = 6

const makeRecipients = (n: number) => Array.from({ length: n }, () => ({ address: Keypair.generate().publicKey.toString(), amount: 1 }))
const makeRecipientsWithAmounts = (amounts: number[]) =>
  amounts.map((amount) => ({ address: Keypair.generate().publicKey.toString(), amount }))

const sendSol = (recipients: ReturnType<typeof makeRecipients>, extra: Partial<Parameters<typeof createMultisenderTransaction>[0]> = {}) =>
  createMultisenderTransaction({ walletPublicKey: WALLET, recipients, ...extra })

const sendSpl = (recipients: ReturnType<typeof makeRecipients>, extra: Partial<Parameters<typeof createMultisenderTransaction>[0]> = {}) =>
  createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients, ...extra })

// Instruction layout produced by the builder for every batch:
// [0] SetComputeUnitLimit, [1] SetComputeUnitPrice, [2] service memo, then optional coupon memo,
// optional service fee transfer and finally the per-recipient transfers.
const decode = (tx: VersionedTransaction): TransactionInstruction[] => TransactionMessage.decompile(tx.message).instructions

const isSystemTransfer = (ix: TransactionInstruction): boolean =>
  ix.programId.equals(SystemProgram.programId) && SystemInstruction.decodeInstructionType(ix) === 'Transfer'

// decodeTransfer returns lamports as bigint — normalise to number for readable assertions
const systemTransfers = (tx: VersionedTransaction) =>
  decode(tx)
    .filter(isSystemTransfer)
    .map((ix) => SystemInstruction.decodeTransfer(ix))
    .map((t) => ({ ...t, lamports: Number(t.lamports) }))

const recipientSolTransfers = (tx: VersionedTransaction) => systemTransfers(tx).filter((t) => !t.toPubkey.equals(FEE_WALLET))

const feeTransfers = (tx: VersionedTransaction) => systemTransfers(tx).filter((t) => t.toPubkey.equals(FEE_WALLET))

const tokenTransfers = (tx: VersionedTransaction, programId = TOKEN_PROGRAM_ID) =>
  decode(tx)
    .filter((ix) => ix.programId.equals(programId))
    .map((ix) => decodeTransferCheckedInstruction(ix, programId))

const createAtaInstructions = (tx: VersionedTransaction) => decode(tx).filter((ix) => ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID))

const computeUnitLimit = (tx: VersionedTransaction): number => ComputeBudgetInstruction.decodeSetComputeUnitLimit(decode(tx)[0]).units

const computeUnitPrice = (tx: VersionedTransaction): number =>
  Number(ComputeBudgetInstruction.decodeSetComputeUnitPrice(decode(tx)[1]).microLamports)

const memoTexts = (tx: VersionedTransaction): string[] =>
  decode(tx)
    .filter((ix) => ix.programId.equals(MEMO_PROGRAM_ID))
    .map((ix) => ix.data.toString('utf8'))

const serializedSizes = (result: CreateMultisenderTransactionResult) => result.transactions.map((tx) => tx.serialize().length)

const recipientCounts = (result: CreateMultisenderTransactionResult) => result.batches.map((batch) => batch.recipientCount)

// Token-2022 variant of the default getMint mock (mint only exists under Token-2022)
const resolveMintAsToken2022 = () =>
  mockGetMint.mockImplementation(async (_conn, _mint, _commitment, programId) => {
    if (programId === TOKEN_2022_PROGRAM_ID) return { decimals: MINT_DECIMALS }
    throw new Error('not classic')
  })

beforeEach(() => {
  vi.clearAllMocks()
  mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({ feeSOL: fee, couponMemoInstruction: null }))
  vi.mocked(getCachedToolConfig).mockResolvedValue({ baseFee: 0.001 } as Awaited<ReturnType<typeof getCachedToolConfig>>)
  vi.mocked(calculateDynamicPriorityFee).mockResolvedValue(1500)
  // Default: mint resolves under the classic Token program only
  mockGetMint = vi.fn().mockImplementation(async (_conn, _mint, _commitment, programId) => {
    if (programId === TOKEN_2022_PROGRAM_ID) throw new Error('not token-2022')
    return { decimals: MINT_DECIMALS }
  })
  mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: BLOCKHASH, lastValidBlockHeight: 4242 })
})

// ---------------------------------------------------------------------------
// SOL transfers
// ---------------------------------------------------------------------------

describe('createMultisenderTransaction — SOL transfers', () => {
  it('should build a single transaction for a small recipient list', async () => {
    const result = await sendSol(makeRecipients(3))

    expect(result.transactions).toHaveLength(1)
    expect(result.batches).toEqual([{ startIndex: 0, recipientCount: 3, sizeBytes: expect.any(Number) }])
    // [computeLimit, computePrice, serviceMemo, feeTransfer, transfer x3]
    const ixs = decode(result.transactions[0])
    expect(ixs).toHaveLength(7)
    ixs.slice(4).forEach((ix) => expect(ix.programId.equals(SystemProgram.programId)).toBe(true))
  })

  it('should transfer the exact lamport amount from the wallet to each recipient', async () => {
    const recipients = makeRecipientsWithAmounts([1.5, 0.000000001, 2])
    const result = await sendSol(recipients)

    const transfers = recipientSolTransfers(result.transactions[0])
    expect(transfers).toHaveLength(3)
    expect(transfers.map((t) => t.toPubkey.toString())).toEqual(recipients.map((r) => r.address))
    expect(transfers.map((t) => t.lamports)).toEqual([1_500_000_000, 1, 2_000_000_000])
    transfers.forEach((t) => expect(t.fromPubkey.equals(WALLET)).toBe(true))
  })

  it('should floor sub-lamport fractions instead of rounding up', async () => {
    const result = await sendSol(makeRecipientsWithAmounts([0.0000000019]))
    expect(recipientSolTransfers(result.transactions[0])[0].lamports).toBe(1)
  })

  it('should report 9 decimals and not look up a token mint for native SOL', async () => {
    const result = await sendSol(makeRecipients(2))

    expect(result.decimals).toBe(9)
    expect(mockGetMint).not.toHaveBeenCalled()
  })

  it('should set the wallet as fee payer and use the fetched blockhash', async () => {
    const result = await sendSol(makeRecipients(2))

    const message = result.transactions[0].message
    expect(message.staticAccountKeys[0].equals(WALLET)).toBe(true)
    expect(message.header.numRequiredSignatures).toBe(1)
    expect(message.recentBlockhash).toBe(BLOCKHASH)
    expect(result.blockhash).toBe(BLOCKHASH)
    expect(result.lastValidBlockHeight).toBe(4242)
    expect(mockGetLatestBlockhash).toHaveBeenCalledWith('confirmed')
  })

  it('should produce unsigned v0 transactions (signing happens client-side)', async () => {
    const result = await sendSol(makeRecipients(1))

    const tx = result.transactions[0]
    expect(tx.version).toBe(0)
    expect(tx.signatures).toHaveLength(1)
    expect(tx.signatures[0].every((byte) => byte === 0)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// SPL / Token-2022 transfers
// ---------------------------------------------------------------------------

describe('createMultisenderTransaction — SPL token transfers', () => {
  it('should build ATA creation + TransferChecked pairs for the classic Token program', async () => {
    const recipients = makeRecipients(2)
    const result = await sendSpl(recipients)

    expect(result.transactions).toHaveLength(1)
    // [computeLimit, computePrice, serviceMemo, feeTransfer, (createATA + transferChecked) x2] = 8
    const ixs = decode(result.transactions[0])
    expect(ixs).toHaveLength(8)
    expect(ixs.slice(4).map((ix) => ix.programId.toString())).toEqual([
      ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
      TOKEN_PROGRAM_ID.toString(),
      ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
      TOKEN_PROGRAM_ID.toString(),
    ])
  })

  it('should scale amounts with the on-chain mint decimals, ignoring the client hint', async () => {
    const recipients = makeRecipientsWithAmounts([1, 0.5, 123.456789])
    // Client claims 9 decimals (the old fallback) — the mint says 6
    const result = await sendSpl(recipients, { decimals: 9 })

    expect(result.decimals).toBe(MINT_DECIMALS)
    const amounts = tokenTransfers(result.transactions[0]).map((t) => t.data.amount)
    expect(amounts).toEqual([BigInt(1_000_000), BigInt(500_000), BigInt(123_456_789)])
  })

  it('should use TransferChecked so the token program enforces the decimals on-chain', async () => {
    const result = await sendSpl(makeRecipients(1))

    const [transfer] = tokenTransfers(result.transactions[0])
    expect(transfer.data.instruction).toBe(12) // TokenInstruction.TransferChecked
    expect(transfer.data.decimals).toBe(MINT_DECIMALS)
    expect(transfer.keys.mint.pubkey.equals(MINT)).toBe(true)
  })

  it('should round floating point artefacts to whole base units instead of failing the BigInt conversion', async () => {
    // These products are not integers in IEEE-754 (e.g. 2.01 * 10^6 === 2009999.9999999998):
    // BigInt() would throw without rounding, and Math.floor would short the recipient by one base unit.
    const cases: [amount: number, decimals: number, expected: bigint][] = [
      [2.01, 6, BigInt(2_010_000)],
      [1.07, 9, BigInt(1_070_000_000)],
      [4.35, 2, BigInt(435)],
    ]
    for (const [amount, decimals] of cases) expect(Number.isInteger(amount * 10 ** decimals)).toBe(false)

    for (const [amount, decimals, expected] of cases) {
      mockGetMint.mockImplementation(async (_conn, _mint, _commitment, programId) => {
        if (programId === TOKEN_2022_PROGRAM_ID) throw new Error('not token-2022')
        return { decimals }
      })
      const result = await sendSpl(makeRecipientsWithAmounts([amount]))
      expect(tokenTransfers(result.transactions[0])[0].data.amount).toBe(expected)
    }
  })

  it('should transfer from the wallet ATA to each recipient ATA with the wallet as signing authority', async () => {
    const recipients = makeRecipients(2)
    const result = await sendSpl(recipients)

    const sourceATA = getAssociatedTokenAddressSync(MINT, WALLET, false, TOKEN_PROGRAM_ID)
    const transfers = tokenTransfers(result.transactions[0])
    transfers.forEach((t, i) => {
      const destATA = getAssociatedTokenAddressSync(MINT, new PublicKey(recipients[i].address), false, TOKEN_PROGRAM_ID)
      expect(t.keys.source.pubkey.equals(sourceATA)).toBe(true)
      expect(t.keys.destination.pubkey.equals(destATA)).toBe(true)
      expect(t.keys.owner.pubkey.equals(WALLET)).toBe(true)
      expect(t.keys.owner.isSigner).toBe(true)
    })
  })

  it('should create each recipient ATA idempotently, paid for by the sender', async () => {
    const recipients = makeRecipients(2)
    const result = await sendSpl(recipients)

    const createAtaIxs = createAtaInstructions(result.transactions[0])
    expect(createAtaIxs).toHaveLength(2)

    createAtaIxs.forEach((ix, i) => {
      const owner = new PublicKey(recipients[i].address)
      const destATA = getAssociatedTokenAddressSync(MINT, owner, false, TOKEN_PROGRAM_ID)
      // CreateIdempotent discriminator — does not fail when the ATA already exists
      expect([...ix.data]).toEqual([1])
      const [payer, ata, ataOwner, mint, systemProgram, tokenProgram] = ix.keys
      expect(payer.pubkey.equals(WALLET)).toBe(true)
      expect(payer.isSigner).toBe(true)
      expect(payer.isWritable).toBe(true)
      expect(ata.pubkey.equals(destATA)).toBe(true)
      expect(ataOwner.pubkey.equals(owner)).toBe(true)
      expect(mint.pubkey.equals(MINT)).toBe(true)
      expect(systemProgram.pubkey.equals(SystemProgram.programId)).toBe(true)
      expect(tokenProgram.pubkey.equals(TOKEN_PROGRAM_ID)).toBe(true)
    })
  })

  it('should use Token-2022 for ATAs and transfers when the mint resolves under Token-2022', async () => {
    resolveMintAsToken2022()
    const recipients = makeRecipients(1)
    const result = await sendSpl(recipients)

    const ixs = decode(result.transactions[0])
    const createAta = createAtaInstructions(result.transactions[0])[0]
    const [transfer] = tokenTransfers(result.transactions[0], TOKEN_2022_PROGRAM_ID)

    const destATA = getAssociatedTokenAddressSync(MINT, new PublicKey(recipients[0].address), false, TOKEN_2022_PROGRAM_ID)
    const sourceATA = getAssociatedTokenAddressSync(MINT, WALLET, false, TOKEN_2022_PROGRAM_ID)
    expect(createAta.keys[1].pubkey.equals(destATA)).toBe(true)
    expect(createAta.keys[5].pubkey.equals(TOKEN_2022_PROGRAM_ID)).toBe(true)
    expect(transfer.keys.source.pubkey.equals(sourceATA)).toBe(true)
    expect(transfer.keys.destination.pubkey.equals(destATA)).toBe(true)
    // No classic Token program instruction should leak in
    expect(ixs.some((ix) => ix.programId.equals(TOKEN_PROGRAM_ID))).toBe(false)
  })

  it('should probe Token-2022 first and fall back to the classic Token program', async () => {
    await sendSpl(makeRecipients(1))

    expect(mockGetMint).toHaveBeenCalledTimes(2)
    expect(mockGetMint.mock.calls[0][1]).toBe(MINT)
    expect(mockGetMint.mock.calls[0][3]).toBe(TOKEN_2022_PROGRAM_ID)
    expect(mockGetMint.mock.calls[1][3]).toBe(TOKEN_PROGRAM_ID)
  })

  it('should reject when the token mint cannot be found under either program', async () => {
    mockGetMint.mockRejectedValue(new Error('nope'))
    await expect(sendSpl(makeRecipients(1))).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })
  })

  it('should reject a program-derived (off-curve) recipient that cannot own an associated token account', async () => {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], TOKEN_PROGRAM_ID)
    const recipients = [...makeRecipients(1), { address: pda.toString(), amount: 1 }]

    await expect(sendSpl(recipients)).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      message: `Recipient ${pda.toString()} is a program-derived address and cannot receive tokens`,
    })
  })
})

// ---------------------------------------------------------------------------
// Compute budget
// ---------------------------------------------------------------------------

describe('createMultisenderTransaction — compute budget', () => {
  it('should start every batch with SetComputeUnitLimit and SetComputeUnitPrice', async () => {
    const result = await sendSol(makeRecipients(25))

    expect(result.transactions.length).toBeGreaterThan(1)
    for (const tx of result.transactions) {
      const [limitIx, priceIx] = decode(tx)
      expect(limitIx.programId.equals(ComputeBudgetProgram.programId)).toBe(true)
      expect(ComputeBudgetInstruction.decodeInstructionType(limitIx)).toBe('SetComputeUnitLimit')
      expect(ComputeBudgetInstruction.decodeInstructionType(priceIx)).toBe('SetComputeUnitPrice')
    }
  })

  it('should budget 10k CU per SOL recipient plus 20k overhead', async () => {
    const result = await sendSol(makeRecipients(3))
    expect(computeUnitLimit(result.transactions[0])).toBe(3 * 10_000 + 20_000)
  })

  it('should budget 60k CU per SPL recipient plus 50k overhead', async () => {
    const result = await sendSpl(makeRecipients(3))
    expect(computeUnitLimit(result.transactions[0])).toBe(3 * 60_000 + 50_000)
  })

  it('should budget 150k CU per Token-2022 recipient plus 50k overhead', async () => {
    resolveMintAsToken2022()
    const result = await sendSpl(makeRecipients(3))
    expect(computeUnitLimit(result.transactions[0])).toBe(3 * 150_000 + 50_000)
  })

  it('should never exceed the 1.4M CU protocol maximum', async () => {
    resolveMintAsToken2022()
    const result = await sendSpl(makeRecipients(40))
    result.transactions.forEach((tx) => expect(computeUnitLimit(tx)).toBeLessThanOrEqual(1_400_000))
  })

  it('should size the budget per batch, not for the whole recipient list', async () => {
    const result = await sendSol(makeRecipients(25))
    const counts = recipientCounts(result)
    result.transactions.forEach((tx, i) => expect(computeUnitLimit(tx)).toBe(counts[i] * 10_000 + 20_000))
  })

  it('should use the dynamic priority fee as the compute unit price', async () => {
    const result = await sendSol(makeRecipients(1))
    expect(computeUnitPrice(result.transactions[0])).toBe(1500)
  })

  it('should fall back to 1000 micro-lamports when priority fee estimation fails', async () => {
    vi.mocked(calculateDynamicPriorityFee).mockRejectedValueOnce(new Error('RPC down'))
    const result = await sendSol(makeRecipients(1))
    expect(computeUnitPrice(result.transactions[0])).toBe(1000)
  })
})

// ---------------------------------------------------------------------------
// Service fee, memos and coupons
// ---------------------------------------------------------------------------

describe('createMultisenderTransaction — service fee and memos', () => {
  it('should charge the per-recipient fee of each batch to the fee wallet', async () => {
    const result = await sendSol(makeRecipients(25))

    expect(result.transactions.length).toBeGreaterThan(1)
    result.batches.forEach((batch, i) => {
      const [fee] = feeTransfers(result.transactions[i])
      expect(fee.fromPubkey.equals(WALLET)).toBe(true)
      expect(fee.lamports).toBe(batch.recipientCount * 1_000_000) // 0.001 SOL per recipient
    })
    expect(result.totalServiceFee).toBeCloseTo(0.025, 9)
  })

  it('should place the fee transfer after the memo and before the recipient transfers', async () => {
    const result = await sendSol(makeRecipients(2))
    const ixs = decode(result.transactions[0])

    expect(ixs[2].programId.equals(MEMO_PROGRAM_ID)).toBe(true)
    expect(SystemInstruction.decodeTransfer(ixs[3]).toPubkey.equals(FEE_WALLET)).toBe(true)
  })

  it('should charge the fee for SPL sends in SOL as well', async () => {
    const result = await sendSpl(makeRecipients(3))
    expect(feeTransfers(result.transactions[0])[0].lamports).toBe(3 * 1_000_000)
  })

  it('should use the base fee configured for the tool', async () => {
    vi.mocked(getCachedToolConfig).mockResolvedValueOnce({ baseFee: 0.0025 } as Awaited<ReturnType<typeof getCachedToolConfig>>)
    const result = await sendSol(makeRecipients(4))

    expect(getCachedToolConfig).toHaveBeenCalledWith('transaction-multisender')
    expect(feeTransfers(result.transactions[0])[0].lamports).toBe(4 * 2_500_000)
    expect(result.totalServiceFee).toBeCloseTo(0.01, 9)
  })

  it('should fall back to the default fee when the tool config lookup throws', async () => {
    vi.mocked(getCachedToolConfig).mockRejectedValueOnce(new Error('Contentful unavailable'))
    const result = await sendSol(makeRecipients(2))

    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(DEFAULT_SERVICE_FEE_SOL, undefined)
    expect(feeTransfers(result.transactions[0])[0].lamports).toBe(2 * DEFAULT_SERVICE_FEE_SOL * 1e9)
  })

  it('should fall back to the default fee when the tool has no configuration', async () => {
    vi.mocked(getCachedToolConfig).mockResolvedValueOnce(null)
    const result = await sendSol(makeRecipients(2))

    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(DEFAULT_SERVICE_FEE_SOL, undefined)
    expect(result.totalServiceFee).toBeCloseTo(2 * DEFAULT_SERVICE_FEE_SOL, 9)
  })

  it('should omit the service fee transfer when the configured fee is zero', async () => {
    vi.mocked(getCachedToolConfig).mockResolvedValueOnce({ baseFee: 0 } as Awaited<ReturnType<typeof getCachedToolConfig>>)
    const result = await sendSol(makeRecipients(2))

    // [computeLimit, computePrice, serviceMemo, transfer x2] = 5 (no fee transfer)
    expect(decode(result.transactions[0])).toHaveLength(5)
    expect(feeTransfers(result.transactions[0])).toHaveLength(0)
    expect(result.totalServiceFee).toBe(0)
  })

  it('should tag every batch with the multisender service memo', async () => {
    const result = await sendSol(makeRecipients(25))

    for (const tx of result.transactions) {
      expect(memoTexts(tx)).toEqual(['transaction-multisender-service'])
    }
  })

  it('should forward the coupon code and base fee to the coupon service', async () => {
    await sendSol(makeRecipients(1), { couponCode: 'SAVE10' })
    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(0.001, 'SAVE10')
  })

  it('should charge the discounted fee and embed the coupon memo in every batch', async () => {
    const couponMemo = new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM_ID, data: Buffer.from('coupon:abc123', 'utf8') })
    mockApplyCouponToServiceFee.mockResolvedValueOnce({ feeSOL: 0.0005, couponMemoInstruction: couponMemo })

    const result = await sendSol(makeRecipients(25), { couponCode: 'SAVE50' })

    expect(result.transactions.length).toBeGreaterThan(1)
    result.batches.forEach((batch, i) => {
      const tx = result.transactions[i]
      // Service memo first, coupon memo right after it
      expect(memoTexts(tx)).toEqual(['transaction-multisender-service', 'coupon:abc123'])
      expect(decode(tx)[3].programId.equals(MEMO_PROGRAM_ID)).toBe(true)
      expect(feeTransfers(tx)[0].lamports).toBe(batch.recipientCount * 500_000)
    })
    expect(result.totalServiceFee).toBeCloseTo(0.0125, 9)
  })

  it('should omit the coupon memo when no coupon is applied', async () => {
    const result = await sendSol(makeRecipients(1))
    expect(memoTexts(result.transactions[0])).toEqual(['transaction-multisender-service'])
  })

  it('should propagate an invalid coupon error unchanged', async () => {
    mockApplyCouponToServiceFee.mockRejectedValueOnce(
      new AppError('INVALID_INPUT', 'Discount coupon is invalid or has no remaining usage', 400)
    )

    await expect(sendSol(makeRecipients(1), { couponCode: 'BADONE' })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      message: 'Discount coupon is invalid or has no remaining usage',
    })
  })
})

// ---------------------------------------------------------------------------
// Batching by transaction size
// ---------------------------------------------------------------------------

describe('createMultisenderTransaction — batching by transaction size', () => {
  it('should keep every transaction within the 1232-byte packet limit for SOL, SPL and Token-2022', async () => {
    const solResult = await sendSol(makeRecipients(60))
    const splResult = await sendSpl(makeRecipients(60))
    resolveMintAsToken2022()
    const token2022Result = await sendSpl(makeRecipients(60))

    for (const result of [solResult, splResult, token2022Result]) {
      expect(result.transactions.length).toBeGreaterThan(1)
      serializedSizes(result).forEach((size) => expect(size).toBeLessThanOrEqual(PACKET_DATA_SIZE))
      result.batches.forEach((batch, i) => expect(batch.sizeBytes).toBe(serializedSizes(result)[i]))
    }
  })

  it('should fill each batch as far as the packet size allows', async () => {
    const recipients = makeRecipients(30)
    const result = await sendSol(recipients)

    // Adding the first recipient of the next batch to any full batch would overflow
    for (let i = 0; i < result.batches.length - 1; i++) {
      const batch = result.batches[i]
      const overfilled = await sendSol(recipients.slice(batch.startIndex, batch.startIndex + batch.recipientCount + 1))
      expect(overfilled.transactions).toHaveLength(2)
    }
  })

  it('should pack more SOL recipients than SPL recipients per transaction', async () => {
    const sol = await sendSol(makeRecipients(40))
    const spl = await sendSpl(makeRecipients(40))

    expect(recipientCounts(sol)[0]).toBeGreaterThan(recipientCounts(spl)[0])
    expect(recipientCounts(spl)[0]).toBeGreaterThanOrEqual(8)
    expect(sol.transactions.length).toBeLessThan(spl.transactions.length)
  })

  it('should fit 9 and 10 SPL recipients by splitting them into two transactions', async () => {
    for (const count of [9, 10]) {
      const result = await sendSpl(makeRecipients(count))
      expect(result.transactions).toHaveLength(2)
      serializedSizes(result).forEach((size) => expect(size).toBeLessThanOrEqual(PACKET_DATA_SIZE))
      expect(recipientCounts(result).reduce((a, b) => a + b, 0)).toBe(count)
    }
  })

  it('should leave room for the coupon memo when packing', async () => {
    const couponMemo = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from('coupon:0123456789abcdef', 'utf8'),
    })
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.0005, couponMemoInstruction: couponMemo })

    const result = await sendSol(makeRecipients(40), { couponCode: 'SAVE50' })

    serializedSizes(result).forEach((size) => expect(size).toBeLessThanOrEqual(PACKET_DATA_SIZE))
    result.transactions.forEach((tx) => expect(memoTexts(tx)).toHaveLength(2))
  })

  it('should apply the packet size limit inclusively (1232 bytes fits, 1233 does not)', async () => {
    // Take a batch that is full without a coupon memo, then grow a coupon memo one byte at a time:
    // the serialized size hits every integer, so the last size that still fits must be exactly 1232.
    const baseline = await sendSol(makeRecipients(40))
    const recipients = makeRecipients(baseline.batches[0].recipientCount)

    let lastSingleTransactionSize = 0
    for (let memoLength = 1; memoLength <= 120; memoLength++) {
      const couponMemo = new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM_ID, data: Buffer.alloc(memoLength, 'x') })
      mockApplyCouponToServiceFee.mockResolvedValueOnce({ feeSOL: 0.001, couponMemoInstruction: couponMemo })

      const result = await sendSol(recipients, { couponCode: 'SAVE10' })
      if (result.transactions.length === 1) {
        lastSingleTransactionSize = result.batches[0].sizeBytes
        continue
      }
      expect(lastSingleTransactionSize).toBe(PACKET_DATA_SIZE)
      expect(result.batches[0].recipientCount).toBe(recipients.length - 1)
      return
    }
    throw new Error('Growing the memo never forced a split — boundary not exercised')
  })

  it('should shrink the next batch when its recipients need more space than the previous batch', async () => {
    // Repeated recipients share one account key, so many more of them fit into a transaction than
    // unique recipients do — the batch after them must be re-packed smaller.
    const repeated = Keypair.generate().publicKey.toString()
    const recipients = [
      ...Array.from({ length: MAX_RECIPIENTS_PER_TRANSACTION }, () => ({ address: repeated, amount: 1 })),
      ...makeRecipients(30),
    ]

    const result = await sendSol(recipients)

    expect(result.batches[0].recipientCount).toBe(MAX_RECIPIENTS_PER_TRANSACTION)
    expect(result.batches[1].recipientCount).toBeLessThan(MAX_RECIPIENTS_PER_TRANSACTION)
    serializedSizes(result).forEach((size) => expect(size).toBeLessThanOrEqual(PACKET_DATA_SIZE))
    expect(recipientCounts(result).reduce((a, b) => a + b, 0)).toBe(recipients.length)
  })

  it('should grow the next batch when its recipients need less space than the previous batch', async () => {
    // Exactly one full batch of unique recipients, followed by repeated recipients (which share
    // one account key and therefore pack beyond the unique batch size, up to the cap).
    const uniqueBatchSize = (await sendSol(makeRecipients(40))).batches[0].recipientCount
    expect(uniqueBatchSize).toBeLessThan(MAX_RECIPIENTS_PER_TRANSACTION)
    const repeated = Keypair.generate().publicKey.toString()
    const recipients = [
      ...makeRecipients(uniqueBatchSize),
      ...Array.from({ length: MAX_RECIPIENTS_PER_TRANSACTION + 5 }, () => ({ address: repeated, amount: 1 })),
    ]

    const result = await sendSol(recipients)

    expect(recipientCounts(result)).toEqual([uniqueBatchSize, MAX_RECIPIENTS_PER_TRANSACTION, 5])
    serializedSizes(result).forEach((size) => expect(size).toBeLessThanOrEqual(PACKET_DATA_SIZE))
  })

  it('should never put more than MAX_RECIPIENTS_PER_TRANSACTION recipients in one transaction', async () => {
    const result = await sendSol(makeRecipients(100))
    recipientCounts(result).forEach((count) => expect(count).toBeLessThanOrEqual(MAX_RECIPIENTS_PER_TRANSACTION))
  })

  it('should describe every batch with contiguous, complete and ordered metadata', async () => {
    const recipients = makeRecipients(45)
    const result = await sendSol(recipients)

    expect(result.batches).toHaveLength(result.transactions.length)
    let expectedStart = 0
    result.batches.forEach((batch, i) => {
      expect(batch.startIndex).toBe(expectedStart)
      expect(batch.recipientCount).toBeGreaterThan(0)
      // The transaction really contains exactly those recipients, in order
      const addresses = recipientSolTransfers(result.transactions[i]).map((t) => t.toPubkey.toString())
      expect(addresses).toEqual(recipients.slice(batch.startIndex, batch.startIndex + batch.recipientCount).map((r) => r.address))
      expectedStart += batch.recipientCount
    })
    expect(expectedStart).toBe(recipients.length)
  })

  it('should preserve recipient order across batches', async () => {
    const recipients = makeRecipients(43)
    const result = await sendSol(recipients)

    const ordered = result.transactions.flatMap((tx) => recipientSolTransfers(tx).map((t) => t.toPubkey.toString()))
    expect(ordered).toEqual(recipients.map((r) => r.address))
  })

  it('should share one blockhash across all batches and fetch it only once', async () => {
    const result = await sendSol(makeRecipients(45))

    expect(mockGetLatestBlockhash).toHaveBeenCalledTimes(1)
    result.transactions.forEach((tx) => expect(tx.message.recentBlockhash).toBe(BLOCKHASH))
  })

  it('should handle the maximum request size of 500 recipients', async () => {
    const result = await sendSpl(makeRecipients(500))

    expect(recipientCounts(result).reduce((a, b) => a + b, 0)).toBe(500)
    serializedSizes(result).forEach((size) => expect(size).toBeLessThanOrEqual(PACKET_DATA_SIZE))
  })

  it('should estimate the network fee from the base fee plus priority fee of every transaction', async () => {
    const result = await sendSol(makeRecipients(25))

    const expectedLamports = result.batches.reduce((sum, batch) => {
      const computeUnits = batch.recipientCount * 10_000 + 20_000
      return sum + 5_000 + Math.ceil((computeUnits * 1500) / 1_000_000)
    }, 0)
    expect(result.estimatedNetworkFee).toBeCloseTo(expectedLamports / 1e9, 12)
    expect(result.estimatedNetworkFee).toBeGreaterThan(result.transactions.length * 0.000005)
  })
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('createMultisenderTransaction — errors', () => {
  it('should reject an empty recipient list with INVALID_INPUT', async () => {
    await expect(sendSol([])).rejects.toMatchObject({ code: 'INVALID_INPUT', message: 'At least one recipient is required' })
  })

  it('should reject an invalid recipient address with INVALID_INPUT', async () => {
    await expect(sendSol([{ address: 'not-a-key', amount: 1 }])).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      message: 'Invalid recipient address: not-a-key',
    })
  })

  it('should wrap unexpected RPC failures in a TRANSACTION_FAILED AppError', async () => {
    mockGetLatestBlockhash.mockRejectedValueOnce(new Error('fetch failed'))

    const error = await sendSol(makeRecipients(1)).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ code: 'TRANSACTION_FAILED', message: 'Failed to prepare multisender transaction' })
  })
})
