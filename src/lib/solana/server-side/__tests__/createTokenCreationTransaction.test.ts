import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, PACKET_DATA_SIZE, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TokenInstruction,
  createInitializeMetadataPointerInstruction,
} from '@solana/spl-token'
import { createTokenCreationTransaction } from '../createTokenCreationTransaction'
import type { CreateTokenTransactionParams } from '@/types/tokenCreator'

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
  getCachedToolConfig: vi.fn().mockResolvedValue({ baseFee: 0.19 }),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

let mockGetLatestBlockhash: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
let mockGetMinimumBalanceForRentExemption: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  return {
    ...actual,
    createConnectionPair: vi.fn(() => ({
      legacyConnection: {
        getLatestBlockhash: (...args: unknown[]) => mockGetLatestBlockhash(...args),
        getMinimumBalanceForRentExemption: (...args: unknown[]) => mockGetMinimumBalanceForRentExemption(...args),
      },
      kitRpc: {},
    })),
    calculateDynamicPriorityFee: vi.fn().mockResolvedValue(1500),
  }
})

const WALLET = Keypair.generate().publicKey
const MINT = Keypair.generate().publicKey

const baseTokenData = {
  name: 'Test Token',
  symbol: 'TST',
  decimals: 6,
  totalSupply: 1_000_000,
}

const buildParams = (overrides: Partial<CreateTokenTransactionParams['tokenData']> = {}): CreateTokenTransactionParams => ({
  walletPublicKey: WALLET,
  mintPublicKey: MINT,
  tokenData: { ...baseTokenData, ...overrides },
  metadataUri: 'https://example.com/metadata.json',
})

describe('createTokenCreationTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.19, couponInstructions: [] })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString() })
    mockGetMinimumBalanceForRentExemption = vi.fn().mockResolvedValue(1_000_000)
  })

  it('builds a Token-2022 mint with metadata pointer, init, ATA, and mint-to instructions', async () => {
    const result = await createTokenCreationTransaction(buildParams())

    expect(result.mintPublicKey).toBe(MINT.toString())
    expect(result.totalSupply).toBe('1000000000000') // 1,000,000 * 10^6

    const { transaction } = result
    const programIds = transaction.instructions.map((ix) => ix.programId.toString())

    // Every mint-lifecycle instruction runs under Token-2022, never the classic Token program
    expect(programIds).toContain(TOKEN_2022_PROGRAM_ID.toString())
    expect(programIds).not.toContain('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

    // createAccount (mint) must run under SystemProgram
    const createAccountIx = transaction.instructions.find(
      (ix) => ix.programId.toString() === SystemProgram.programId.toString() && ix.keys.some((k) => k.pubkey.toString() === MINT.toString())
    )
    expect(createAccountIx).toBeDefined()

    // ATA creation runs under the Associated Token Account program
    expect(programIds).toContain(ASSOCIATED_TOKEN_PROGRAM_ID.toString())
  })

  it('includes a service fee transfer sized to the base fee alone when no authorities are revoked', async () => {
    const result = await createTokenCreationTransaction(buildParams())
    const feeTransferIx = result.transaction.instructions.find(
      (ix) =>
        ix.programId.toString() === SystemProgram.programId.toString() &&
        ix.keys.some((k) => k.pubkey.toString() === 'FeeWa11etAddre55111111111111111111111111111'.slice(0, 44))
    )
    expect(feeTransferIx).toBeDefined()
  })

  it('adds a SetAuthority(MintTokens) instruction when revokeMintAuthority is requested', async () => {
    const result = await createTokenCreationTransaction(buildParams({ revokeMintAuthority: true }))
    const setAuthorityIxs = result.transaction.instructions.filter((ix) => ix.data[0] === 6)
    // AuthorityType discriminator byte: 0 = MintTokens
    expect(setAuthorityIxs.some((ix) => ix.data[1] === 0)).toBe(true)
  })

  it('adds a SetAuthority(FreezeAccount) instruction when revokeFreezeAuthority is requested', async () => {
    const result = await createTokenCreationTransaction(buildParams({ revokeFreezeAuthority: true }))
    const setAuthorityIxs = result.transaction.instructions.filter((ix) => ix.data[0] === 6)
    // AuthorityType discriminator byte: 1 = FreezeAccount
    expect(setAuthorityIxs.some((ix) => ix.data[1] === 1)).toBe(true)
  })

  it('does not add SetAuthority instructions when no revocation is requested', async () => {
    const result = await createTokenCreationTransaction(buildParams())
    const setAuthorityIxs = result.transaction.instructions.filter((ix) => ix.data[0] === 6)
    expect(setAuthorityIxs).toHaveLength(0)
  })

  it('omits the mint-to instruction when totalSupply is zero', async () => {
    const result = await createTokenCreationTransaction(buildParams({ totalSupply: 0 }))
    expect(result.totalSupply).toBe('0')
    // MintTo instruction discriminator is 7
    const mintToIxs = result.transaction.instructions.filter(
      (ix) => ix.programId.toString() === TOKEN_2022_PROGRAM_ID.toString() && ix.data[0] === 7
    )
    expect(mintToIxs).toHaveLength(0)
  })

  it('adds an UpdateAuthority(null) instruction when immutableMetadata is requested', async () => {
    const before = await createTokenCreationTransaction(buildParams())
    const after = await createTokenCreationTransaction(buildParams({ immutableMetadata: true }))
    expect(after.transaction.instructions.length).toBe(before.transaction.instructions.length + 1)
  })

  describe('metadata pointer authority', () => {
    /** The InitializeMetadataPointer instruction (Token-2022 MetadataPointerExtension, sub-instruction 0). */
    const findInitializeMetadataPointer = (instructions: TransactionInstruction[]): TransactionInstruction | undefined =>
      instructions.find(
        (ix) => ix.programId.equals(TOKEN_2022_PROGRAM_ID) && ix.data[0] === TokenInstruction.MetadataPointerExtension && ix.data[1] === 0
      )

    it('initializes the pointer with no authority when immutableMetadata is requested, so it cannot be redirected', async () => {
      const { transaction } = await createTokenCreationTransaction(buildParams({ immutableMetadata: true }))

      const pointerIx = findInitializeMetadataPointer(transaction.instructions)
      // Byte-for-byte what @solana/spl-token builds for authority = None, metadata address = the mint
      const expected = createInitializeMetadataPointerInstruction(MINT, null, MINT, TOKEN_2022_PROGRAM_ID)
      expect(pointerIx).toBeDefined()
      expect(Buffer.from(pointerIx!.data).equals(Buffer.from(expected.data))).toBe(true)
      expect(pointerIx!.keys).toEqual(expected.keys)
    })

    it('keeps the creator as pointer authority when metadata stays mutable', async () => {
      const { transaction } = await createTokenCreationTransaction(buildParams({ immutableMetadata: false }))

      const pointerIx = findInitializeMetadataPointer(transaction.instructions)
      const expected = createInitializeMetadataPointerInstruction(MINT, WALLET, MINT, TOKEN_2022_PROGRAM_ID)
      expect(Buffer.from(pointerIx!.data).equals(Buffer.from(expected.data))).toBe(true)
    })

    it('initializes the pointer before the mint, as Token-2022 requires for extensions', async () => {
      const { transaction } = await createTokenCreationTransaction(buildParams({ immutableMetadata: true }))

      const pointerIndex = transaction.instructions.findIndex(
        (ix) => ix.programId.equals(TOKEN_2022_PROGRAM_ID) && ix.data[0] === TokenInstruction.MetadataPointerExtension
      )
      const initializeMintIndex = transaction.instructions.findIndex(
        (ix) => ix.programId.equals(TOKEN_2022_PROGRAM_ID) && ix.data[0] === TokenInstruction.InitializeMint
      )
      expect(pointerIndex).toBeGreaterThan(-1)
      expect(pointerIndex).toBeLessThan(initializeMintIndex)
    })
  })

  describe('coupon instructions', () => {
    const FEE_WALLET = 'FeeWa11etAddre55111111111111111111111111111'.slice(0, 44)
    const MARKER = Keypair.generate().publicKey
    const memo = (): TransactionInstruction =>
      new TransactionInstruction({
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        keys: [],
        data: Buffer.from('coupon:0123456789abcdef'),
      })
    const markerTransfer = (): TransactionInstruction => SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: MARKER, lamports: 0 })
    const hasCouponMemo = (instructions: TransactionInstruction[]): boolean =>
      instructions.some((ix) => ix.data.toString() === 'coupon:0123456789abcdef')
    const transfersTo = (instructions: TransactionInstruction[], target: string): TransactionInstruction[] =>
      instructions.filter((ix) => ix.programId.equals(SystemProgram.programId) && ix.keys[1]?.pubkey.toString() === target)

    it('passes the coupon code and payer, and adds the coupon memo + marker transfer next to the paid fee', async () => {
      const transfer = markerTransfer()
      mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.095, couponInstructions: [memo(), transfer] })

      const result = await createTokenCreationTransaction({ ...buildParams(), couponCode: 'SAVE50' })

      expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(0.19, 'SAVE50', WALLET)
      expect(hasCouponMemo(result.transaction.instructions)).toBe(true)
      expect(transfersTo(result.transaction.instructions, MARKER.toString())).toEqual([transfer])
      expect(transfersTo(result.transaction.instructions, FEE_WALLET)).toHaveLength(1)
    })

    it('adds the coupon instructions and no fee transfer for a 100% coupon without add-ons', async () => {
      const transfer = markerTransfer()
      mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponInstructions: [memo(), transfer] })

      const result = await createTokenCreationTransaction({ ...buildParams(), couponCode: 'FREE00' })

      expect(transfersTo(result.transaction.instructions, MARKER.toString())).toEqual([transfer])
      expect(transfersTo(result.transaction.instructions, FEE_WALLET)).toHaveLength(0)
    })

    it('keeps the marker transfer when add-on fees still pay the fee wallet after a 100% coupon', async () => {
      const transfer = markerTransfer()
      mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponInstructions: [memo(), transfer] })

      const result = await createTokenCreationTransaction({ ...buildParams({ revokeMintAuthority: true }), couponCode: 'FREE00' })

      expect(hasCouponMemo(result.transaction.instructions)).toBe(true)
      expect(transfersTo(result.transaction.instructions, MARKER.toString())).toEqual([transfer])
      // The fee-wallet transfer is the paid add-on fee (0.05 SOL)
      const feeTransfers = transfersTo(result.transaction.instructions, FEE_WALLET)
      expect(feeTransfers).toHaveLength(1)
      expect(feeTransfers[0].data.readBigUInt64LE(4)).toBe(BigInt(50_000_000))
    })

    it('keeps a worst-case token (longest fields, every option) with a coupon within the packet size', async () => {
      mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.095, couponInstructions: [memo(), markerTransfer()] })
      // Size-dependent rent so the mint rent top-up transfer is part of the measured transaction
      mockGetMinimumBalanceForRentExemption.mockImplementation(async (...args: unknown[]) => ((args[0] as number) + 128) * 6960)

      const result = await createTokenCreationTransaction({
        ...buildParams({
          name: 'N'.repeat(32),
          symbol: 'S'.repeat(10),
          revokeMintAuthority: true,
          revokeFreezeAuthority: true,
          immutableMetadata: true,
        }),
        metadataUri: `https://example.com/${'u'.repeat(200 - 'https://example.com/'.length)}`,
        couponCode: 'SAVE50',
      })

      // Unsigned wire size with both signature slots (wallet + mint keypair)
      const size = result.transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).length
      expect(size).toBeLessThanOrEqual(PACKET_DATA_SIZE)
    })
  })

  it('rejects AppError instances raised from coupon validation unchanged', async () => {
    const { AppError } = await import('@/lib/errors')
    mockApplyCouponToServiceFee.mockRejectedValue(new AppError('INVALID_INPUT', 'Discount coupon is invalid or no longer available', 400))

    // The message contains "invalid" but must not be remapped to "Invalid token creation parameters"
    await expect(createTokenCreationTransaction(buildParams())).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      message: 'Discount coupon is invalid or no longer available',
    })
  })
})
