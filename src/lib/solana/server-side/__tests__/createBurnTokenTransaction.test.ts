import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { createBurnTokenTransaction } from '../createBurnTokenTransaction'
import { AppError } from '@/lib/errors'

// Mock server-only to prevent server-side directive errors in test environment
vi.mock('server-only', () => ({}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    rpcPrivateEndpoint: 'https://api.devnet.solana.com',
    feeWalletAddress: 'FeeWa11etAddre55111111111111111111111111111',
  })),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

const mockGetCachedToolConfig = vi.hoisted(() => vi.fn())
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: (...args: unknown[]) => mockGetCachedToolConfig(...args),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

const TOKEN_PROGRAM_ID_STR = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const TOKEN_2022_PROGRAM_ID_STR = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
const BURN_CHECKED_DISCRIMINATOR = 15

const WALLET = Keypair.generate().publicKey
const TOKEN_ACCOUNT = Keypair.generate().publicKey
const MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

interface ParsedAccountOverrides {
  owner?: string
  mint?: string
  amount?: string
  state?: string
  programOwner?: string
  decimals?: number
}

const makeParsedAccountInfo = (overrides: ParsedAccountOverrides = {}) => ({
  value: {
    owner: overrides.programOwner ?? TOKEN_PROGRAM_ID_STR,
    data: {
      program: 'spl-token',
      parsed: {
        info: {
          mint: overrides.mint ?? MINT.toString(),
          owner: overrides.owner ?? WALLET.toString(),
          tokenAmount: {
            amount: overrides.amount ?? '1000000000',
            decimals: overrides.decimals ?? 9,
            uiAmount: 1,
            uiAmountString: '1',
          },
          state: overrides.state ?? 'initialized',
        },
      },
    },
  },
})

let mockGetParsedAccountInfo: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
let mockGetBalance: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
let mockGetLatestBlockhash: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  return {
    ...actual,
    createConnectionPair: vi.fn(() => ({
      legacyConnection: {
        getParsedAccountInfo: (...args: unknown[]) => mockGetParsedAccountInfo(...args),
        getBalance: (...args: unknown[]) => mockGetBalance(...args),
        getLatestBlockhash: (...args: unknown[]) => mockGetLatestBlockhash(...args),
      },
      kitRpc: {},
    })),
    addComputeBudgetInstructions: vi.fn((transaction, computeUnits: number, priorityFee: number) => {
      // Mirror real behavior minimally: push two placeholder instructions so ordering assertions hold
      transaction.instructions.push({
        programId: new PublicKey('ComputeBudget111111111111111111111111111111'),
        keys: [],
        data: Buffer.from([1, computeUnits]),
      })
      transaction.instructions.push({
        programId: new PublicKey('ComputeBudget111111111111111111111111111111'),
        keys: [],
        data: Buffer.from([2, priorityFee]),
      })
    }),
    calculateDynamicPriorityFee: vi.fn().mockResolvedValue(1500),
    lamportsToSol: (lamports: number) => lamports / 1_000_000_000,
  }
})

describe('createBurnTokenTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCachedToolConfig.mockResolvedValue({ baseFee: 0.01 })
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.01, couponMemoInstruction: null })
    mockGetParsedAccountInfo = vi.fn().mockResolvedValue(makeParsedAccountInfo())
    mockGetBalance = vi.fn().mockResolvedValue(1_000_000_000) // 1 SOL
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: 'test-blockhash-1234' })
  })

  it('builds a burn transaction for the classic SPL Token program', async () => {
    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: 0.5,
      mintAddress: MINT,
      decimals: 9,
    })

    expect(result.rawAmount).toBe('500000000')
    expect(result.uiAmount).toBe(0.5)
    expect(result.tokenAccount).toBe(TOKEN_ACCOUNT.toString())
    expect(result.mint).toBe(MINT.toString())

    const { transaction } = result
    expect(transaction.recentBlockhash).toBe('test-blockhash-1234')
    expect(transaction.feePayer?.toString()).toBe(WALLET.toString())

    // Order: [computeBudget x2, serviceMemo, nonceMemo, serviceFeeTransfer, burnInstruction]
    expect(transaction.instructions).toHaveLength(6)

    const burnIx = transaction.instructions[transaction.instructions.length - 1]
    expect(burnIx.programId.toString()).toBe(TOKEN_PROGRAM_ID_STR)
    // BurnChecked key order: [account, mint, owner]
    expect(burnIx.keys[0].pubkey.toString()).toBe(TOKEN_ACCOUNT.toString())
    expect(burnIx.keys[1].pubkey.toString()).toBe(MINT.toString())
    expect(burnIx.keys[2].pubkey.toString()).toBe(WALLET.toString())
    // BurnChecked data: [discriminator u8, amount u64 LE, decimals u8]
    expect(burnIx.data[0]).toBe(BURN_CHECKED_DISCRIMINATOR)
    expect(burnIx.data.readBigUInt64LE(1)).toBe(BigInt(500_000_000))
    expect(burnIx.data[9]).toBe(9)
  })

  it.each([
    [0, 3, '3'],
    [6, 3, '3000000'],
    [9, 3, '3000000000'],
  ])('uses the on-chain decimals (%i) and ignores the client-supplied decimals', async (onChainDecimals, amount, expectedRaw) => {
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ decimals: onChainDecimals, amount: '5000000000000' }))

    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount,
      mintAddress: MINT,
      decimals: onChainDecimals === 9 ? 0 : 9, // a guessed/stale client value must not change the burn
    })

    expect(result.rawAmount).toBe(expectedRaw)
    const burnIx = result.transaction.instructions[result.transaction.instructions.length - 1]
    expect(burnIx.data[0]).toBe(BURN_CHECKED_DISCRIMINATOR)
    expect(burnIx.data.readBigUInt64LE(1)).toBe(BigInt(expectedRaw))
    expect(burnIx.data[9]).toBe(onChainDecimals)
  })

  it('works without client-supplied decimals', async () => {
    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: 0.5,
      mintAddress: MINT,
    })
    expect(result.rawAmount).toBe('500000000')
  })

  it('converts "1.000001" with 6 decimals to exactly 1000001 base units', async () => {
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ decimals: 6, amount: '5000000' }))

    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: '1.000001',
      mintAddress: MINT,
    })

    expect(result.rawAmount).toBe('1000001')
    expect(result.uiAmount).toBe(1.000001)
  })

  it('rejects amounts with more fractional digits than the on-chain decimals', async () => {
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ decimals: 0, amount: '100' }))

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: 1.5,
        mintAddress: MINT,
        decimals: 9,
      })
    ).rejects.toMatchObject({ code: 'INVALID_AMOUNT' })
  })

  it('rejects amounts that overflow u64', async () => {
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ decimals: 0 }))

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: '18446744073709551616',
        mintAddress: MINT,
      })
    ).rejects.toMatchObject({ code: 'AMOUNT_TOO_LARGE' })
  })

  it('rejects accounts that are not owned by a token program', async () => {
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ programOwner: SystemProgram.programId.toString() }))

    await expect(
      createBurnTokenTransaction({ walletPublicKey: WALLET, tokenAccountAddress: TOKEN_ACCOUNT, amount: 0.5, mintAddress: MINT })
    ).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })
  })

  it('charges the hard-coded minimum fee when the tool config is unavailable', async () => {
    mockGetCachedToolConfig.mockResolvedValue(null)
    mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({ feeSOL: fee, couponMemoInstruction: null }))

    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: 0.5,
      mintAddress: MINT,
    })

    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(0.009, undefined)
    const feeIx = result.transaction.instructions[4]
    expect(feeIx.programId.toString()).toBe(SystemProgram.programId.toString())
    // SystemProgram transfer layout: u32 instruction index, u64 lamports
    expect(feeIx.data.readBigUInt64LE(4)).toBe(BigInt(9_000_000))
  })

  it('honors an explicit baseFee of 0 from the tool config', async () => {
    mockGetCachedToolConfig.mockResolvedValue({ baseFee: 0 })
    mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({ feeSOL: fee, couponMemoInstruction: null }))

    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: 0.5,
      mintAddress: MINT,
    })

    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(0, undefined)
    // Order: [computeBudget x2, serviceMemo, nonceMemo, burnInstruction] = 5 (no fee transfer)
    expect(result.transaction.instructions).toHaveLength(5)
  })

  it('detects and uses TOKEN_2022_PROGRAM_ID when the account is owned by Token-2022', async () => {
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ programOwner: TOKEN_2022_PROGRAM_ID_STR }))

    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: 0.5,
      mintAddress: MINT,
      decimals: 9,
    })

    const burnIx = result.transaction.instructions[result.transaction.instructions.length - 1]
    expect(burnIx.programId.toString()).toBe(TOKEN_2022_PROGRAM_ID_STR)
  })

  it('includes a service fee transfer instruction when the base fee is non-zero', async () => {
    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: 0.5,
      mintAddress: MINT,
      decimals: 9,
    })

    // instructions[4] = service fee transfer (SystemProgram), instructions[5] = burn
    const feeIx = result.transaction.instructions[4]
    expect(feeIx.programId.toString()).toBe(SystemProgram.programId.toString())
  })

  it('omits the service fee transfer when the fee resolves to zero', async () => {
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponMemoInstruction: null })

    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: 0.5,
      mintAddress: MINT,
      decimals: 9,
    })

    // Order: [computeBudget x2, serviceMemo, nonceMemo, burnInstruction] = 5 (no fee transfer)
    expect(result.transaction.instructions).toHaveLength(5)
  })

  it('includes the coupon memo instruction when a coupon is applied', async () => {
    const couponMemoInstruction = {
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      keys: [],
      data: Buffer.from('coupon:abc'),
    }
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.005, couponMemoInstruction })

    const result = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: 0.5,
      mintAddress: MINT,
      decimals: 9,
      couponCode: 'SAVE50',
    })

    // Order: [computeBudget x2, serviceMemo, couponMemo, nonceMemo, feeTransfer, burn] = 7
    expect(result.transaction.instructions).toHaveLength(7)
    expect(result.transaction.instructions[3].data.toString()).toBe('coupon:abc')
  })

  it.each([
    [0, 'INVALID_AMOUNT'],
    [-1, 'INVALID_AMOUNT'],
  ])('rejects a non-positive amount (%s) with %s', async (amount, code) => {
    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount,
        mintAddress: MINT,
        decimals: 9,
      })
    ).rejects.toMatchObject({ code })
  })

  it('rejects when the token account cannot be found', async () => {
    mockGetParsedAccountInfo.mockResolvedValue({ value: null })

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: 0.5,
        mintAddress: MINT,
        decimals: 9,
      })
    ).rejects.toMatchObject({ code: 'TOKEN_ACCOUNT_NOT_FOUND' })
  })

  it('rejects when the wallet does not own the token account', async () => {
    const otherOwner = Keypair.generate().publicKey
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ owner: otherOwner.toString() }))

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: 0.5,
        mintAddress: MINT,
        decimals: 9,
      })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('rejects when the token account mint does not match the requested mint', async () => {
    const otherMint = Keypair.generate().publicKey
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ mint: otherMint.toString() }))

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: 0.5,
        mintAddress: MINT,
        decimals: 9,
      })
    ).rejects.toMatchObject({ code: 'INVALID_TOKEN_ADDRESS' })
  })

  it('rejects when the token account is frozen', async () => {
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ state: 'frozen' }))

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: 0.5,
        mintAddress: MINT,
        decimals: 9,
      })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('rejects when the token balance is insufficient', async () => {
    mockGetParsedAccountInfo.mockResolvedValue(makeParsedAccountInfo({ amount: '100' }))

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: 0.5,
        mintAddress: MINT,
        decimals: 9,
      })
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_TOKEN_BALANCE' })
  })

  it('rejects when the wallet SOL balance is insufficient for fees', async () => {
    mockGetBalance.mockResolvedValue(0)

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: 0.5,
        mintAddress: MINT,
        decimals: 9,
      })
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_FUNDS' })
  })

  it('wraps RPC errors as RPC_CONNECTION_FAILED', async () => {
    mockGetParsedAccountInfo.mockRejectedValue(new Error('boom'))

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: 0.5,
        mintAddress: MINT,
        decimals: 9,
      })
    ).rejects.toMatchObject({ code: 'RPC_CONNECTION_FAILED' })
  })

  it('re-throws AppError instances unchanged', async () => {
    mockApplyCouponToServiceFee.mockRejectedValue(
      new AppError('INVALID_INPUT', 'Discount coupon is invalid or has no remaining usage', 400)
    )

    await expect(
      createBurnTokenTransaction({
        walletPublicKey: WALLET,
        tokenAccountAddress: TOKEN_ACCOUNT,
        amount: 0.5,
        mintAddress: MINT,
        decimals: 9,
        couponCode: 'BADCODE',
      })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })
})
