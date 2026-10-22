import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, PublicKey, TransactionMessage, SystemProgram, type TransactionInstruction } from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  MintLayout,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { createMultisenderTransaction } from '../createMultisenderTransaction'

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
const WALLET = Keypair.generate().publicKey
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
    mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({ feeSOL: fee, couponMemoInstruction: null }))
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

  it.each([0, 6, 9])('should scale with the on-chain decimals (%i) and ignore the client-supplied decimals', async (onChainDecimals) => {
    mockGetAccountInfo.mockResolvedValue(makeMintAccount(onChainDecimals))

    const result = await createMultisenderTransaction({
      walletPublicKey: WALLET,
      tokenMintAddress: MINT,
      recipients: makeRecipients(1, 3),
      decimals: onChainDecimals === 9 ? 6 : 9, // stale/guessed client value must not matter
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

    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(0.001, undefined)
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
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponMemoInstruction: null })
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: makeRecipients(2) })

    expect(decompile(result)).toHaveLength(5)
    expect(result.totalServiceFee).toBe(0)
  })
})
