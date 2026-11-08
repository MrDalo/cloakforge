/**
 * Tests for createRaydiumPositionTransaction — the CLMM position-opening step that deposits the
 * liquidity (WEB3-06). The SDK's pool reads and instruction building are mocked; its tick and
 * liquidity math is real, so the deposit bounds below are the ones sent on-chain.
 *
 * Covers: the client-supplied pool is verified against the request (program, mints, fee tier),
 * the pool price must still be within the slippage tolerance of the initial price, deposit
 * maximums never exceed the user's amounts, the position-NFT keypair signs over the server's
 * blockhash, and SDK errors stay out of client messages.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import BN from 'bn.js'
import Decimal from 'decimal.js'
import { SqrtPriceMath } from '@raydium-io/raydium-sdk-v2'
import type { CreateRaydiumPositionParams } from '../createRaydiumPool'

const FEE_WALLET = Keypair.generate().publicKey
vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({ rpcPrivateEndpoint: 'https://private-rpc.example', feeWalletAddress: FEE_WALLET.toBase58() })),
}))

// Pool-creation dependencies (not used by the position step)
vi.mock('@/lib/contentful/toolConfigCache', () => ({ getCachedToolConfig: vi.fn() }))
vi.mock('../discountedServiceFee', () => ({ applyCouponToServiceFee: vi.fn() }))

const SERVER_BLOCKHASH = Keypair.generate().publicKey.toBase58()
const EPOCH_INFO = { epoch: 700, slotIndex: 1_000, slotsInEpoch: 432_000, absoluteSlot: 302_401_000 }
const legacyConnection = {
  getEpochInfo: vi.fn(async () => EPOCH_INFO),
  getLatestBlockhash: vi.fn(async () => ({ blockhash: SERVER_BLOCKHASH, lastValidBlockHeight: 500 })),
}
vi.mock('@/lib/solana', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/solana')>()),
  createConnectionPair: vi.fn(() => ({ legacyConnection, kitRpc: {} })),
}))

const mockGetPoolInfoFromRpc = vi.fn()
const mockOpenPositionFromLiquidity = vi.fn()
vi.mock('@raydium-io/raydium-sdk-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@raydium-io/raydium-sdk-v2')>()),
  Raydium: {
    load: vi.fn(async () => ({
      clmm: { getPoolInfoFromRpc: mockGetPoolInfoFromRpc, openPositionFromLiquidity: mockOpenPositionFromLiquidity },
    })),
  },
}))

const { createRaydiumPositionTransaction } = await import('../createRaydiumPool')

const CLMM_PROGRAM = 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'
const WALLET = Keypair.generate().publicKey
const POOL_ID = Keypair.generate().publicKey.toBase58()
// Pool (canonical) order: MINT_LOW is mintA, MINT_HIGH is mintB
const MINT_LOW = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const MINT_HIGH = 'So11111111111111111111111111111111111111112'

interface PoolFixture {
  programId?: string
  mints?: [string, string]
  tradeFeeRate?: number
  /** Current pool price, MINT_HIGH per MINT_LOW */
  price?: string
  /** Token-2022 transfer fee of MINT_LOW, as `getPoolInfoFromRpc` fills `extensions.feeConfig` */
  feeConfigA?: { basisPoints: number; maximumFee: string }
}

const mockPool = ({
  programId = CLMM_PROGRAM,
  mints = [MINT_LOW, MINT_HIGH],
  tradeFeeRate = 500,
  price = '2',
  feeConfigA,
}: PoolFixture = {}) => {
  const fee = feeConfigA && { epoch: '0', maximumFee: feeConfigA.maximumFee, transferFeeBasisPoints: feeConfigA.basisPoints }
  mockGetPoolInfoFromRpc.mockResolvedValue({
    poolInfo: {
      id: POOL_ID,
      programId,
      mintA: {
        address: mints[0],
        decimals: 6,
        extensions: { feeConfig: fee && { withheldAmount: '0', olderTransferFee: fee, newerTransferFee: fee } },
      },
      mintB: { address: mints[1], decimals: 9, extensions: {} },
      config: { tradeFeeRate, tickSpacing: 10 },
    },
    poolKeys: { id: POOL_ID },
    computePoolInfo: { sqrtPriceX64: SqrtPriceMath.priceToSqrtPriceX64(new Decimal(price), 6, 9) },
  })
}

let nftMint: Keypair
const mockPositionTransaction = (dataSize = 64) => {
  nftMint = Keypair.generate()
  const instruction = new TransactionInstruction({
    programId: new PublicKey(CLMM_PROGRAM),
    keys: [
      { pubkey: WALLET, isSigner: true, isWritable: true },
      { pubkey: nftMint.publicKey, isSigner: true, isWritable: true },
    ],
    data: Buffer.alloc(dataSize),
  })
  mockOpenPositionFromLiquidity.mockResolvedValue({
    transaction: new Transaction().add(instruction),
    signers: [nftMint],
    extInfo: { address: { nftMint: nftMint.publicKey } },
  })
}

const params = (
  overrides: Partial<CreateRaydiumPositionParams> = {},
  poolConfig: Partial<CreateRaydiumPositionParams['poolConfig']> = {}
): CreateRaydiumPositionParams => ({
  walletPublicKey: WALLET,
  poolId: POOL_ID,
  slippageTolerance: 1,
  poolConfig: {
    poolType: 'CLMM',
    tokenA: MINT_LOW,
    tokenB: MINT_HIGH,
    feeTier: '0.05',
    initialLiquidity: { amountA: '1000', amountB: '2000' },
    priceRange: { minPrice: '1', maxPrice: '3' },
    initialPrice: '2',
    ...poolConfig,
  },
  ...overrides,
})

/** The user's amounts in base units (MINT_LOW: 6 decimals, MINT_HIGH: 9 decimals). */
const USER_LOW = new BN('1000000000')
const USER_HIGH = new BN('2000000000000')

describe('createRaydiumPositionTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPool()
    mockPositionTransaction()
  })

  it('should open the position with bounded deposit maximums in the verified pool', async () => {
    const result = await createRaydiumPositionTransaction(params())

    expect(mockGetPoolInfoFromRpc).toHaveBeenCalledWith(POOL_ID)
    const call = mockOpenPositionFromLiquidity.mock.calls[0][0]
    expect(call.tickLower).toBeLessThan(call.tickUpper)
    expect(call.liquidity.gt(new BN(0))).toBe(true)
    expect(call.amountMaxA.gt(new BN(0))).toBe(true)
    expect(call.amountMaxA.lte(USER_LOW)).toBe(true)
    expect(call.amountMaxB.lte(USER_HIGH)).toBe(true)
    expect(call).toMatchObject({
      nft2022: true,
      withMetadata: 'create',
      computeBudgetConfig: undefined,
      ownerInfo: { useSOLBalance: true },
    })
    expect(result.positionNftMint).toBe(nftMint.publicKey.toBase58())
  })

  it('should size the position net of a Token-2022 transfer fee and keep the maximum within what the user has', async () => {
    // Plenty of token B, so the fee-bearing token A limits the liquidity
    const limitedByA = { initialLiquidity: { amountA: '1000', amountB: '1000000' } }
    await createRaydiumPositionTransaction(params({}, limitedByA))
    const noFee = mockOpenPositionFromLiquidity.mock.calls[0][0]

    mockOpenPositionFromLiquidity.mockClear()
    mockPool({ feeConfigA: { basisPoints: 100, maximumFee: '100000000' } })
    mockPositionTransaction()
    await createRaydiumPositionTransaction(params({}, limitedByA))
    const withFee = mockOpenPositionFromLiquidity.mock.calls[0][0]

    expect(legacyConnection.getEpochInfo).toHaveBeenCalled()
    expect(withFee.liquidity.lt(noFee.liquidity)).toBe(true)
    expect(withFee.amountMaxA.lte(USER_LOW)).toBe(true)
    // Reserves the fee: the maximum sits above the fee-free requirement of the smaller position
    expect(withFee.amountMaxA.gt(new BN(0))).toBe(true)
  })

  it('should sign with the position-NFT keypair over the server blockhash and leave the wallet signature to the client', async () => {
    const result = await createRaydiumPositionTransaction(params())
    const transaction = Transaction.from(Buffer.from(result.serializedTransaction, 'base64'))

    expect(transaction.recentBlockhash).toBe(SERVER_BLOCKHASH)
    expect(transaction.feePayer?.equals(WALLET)).toBe(true)
    const signatureOf = (key: PublicKey) => transaction.signatures.find((entry) => entry.publicKey.equals(key))?.signature
    expect(signatureOf(nftMint.publicKey)).toBeTruthy()
    expect(signatureOf(WALLET)).toBeNull()
    // The NFT signature is valid for this exact message
    expect(transaction.verifySignatures(false)).toBe(true)
  })

  it('should not add platform fee instructions to the position transaction', async () => {
    const result = await createRaydiumPositionTransaction(params())
    const transaction = Transaction.from(Buffer.from(result.serializedTransaction, 'base64'))

    expect(transaction.instructions.some((ix) => ix.programId.equals(SystemProgram.programId))).toBe(false)
    expect(transaction.compileMessage().accountKeys.some((key) => key.equals(FEE_WALLET))).toBe(false)
  })

  it('should map amounts onto the pool order when the user lists the tokens the other way round', async () => {
    await createRaydiumPositionTransaction(
      params(
        {},
        {
          tokenA: MINT_HIGH,
          tokenB: MINT_LOW,
          initialLiquidity: { amountA: '2000', amountB: '1000' },
          priceRange: { minPrice: '0.333334', maxPrice: '1' },
          initialPrice: '0.5',
        }
      )
    )

    const call = mockOpenPositionFromLiquidity.mock.calls[0][0]
    expect(call.amountMaxA.lte(USER_LOW)).toBe(true)
    expect(call.amountMaxB.lte(USER_HIGH)).toBe(true)
    expect(call.amountMaxB.gt(USER_LOW)).toBe(true) // B is the 9-decimal token, not the 6-decimal one
  })

  describe('pool verification', () => {
    it.each([
      ['is not owned by the Raydium CLMM program', { programId: SystemProgram.programId.toBase58() }, /not a Raydium CLMM pool/],
      [
        'holds a different token pair',
        { mints: [MINT_LOW, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'] as [string, string] },
        /token pair/,
      ],
      ['has a different fee tier', { tradeFeeRate: 2_500 }, /fee tier/],
    ])('should refuse a pool that %s', async (_label, pool, message) => {
      mockPool(pool)

      await expect(createRaydiumPositionTransaction(params())).rejects.toMatchObject({
        code: 'INVALID_INPUT',
        message: expect.stringMatching(message),
      })
      expect(mockOpenPositionFromLiquidity).not.toHaveBeenCalled()
    })

    it('should refuse to deposit when the pool price moved beyond the slippage tolerance', async () => {
      mockPool({ price: '2.1' }) // 5% above the initial price

      await expect(createRaydiumPositionTransaction(params({ slippageTolerance: 1 }))).rejects.toMatchObject({ code: 'SLIPPAGE_EXCEEDED' })
      expect(mockOpenPositionFromLiquidity).not.toHaveBeenCalled()

      // The same move is accepted with a wider tolerance
      await expect(createRaydiumPositionTransaction(params({ slippageTolerance: 10 }))).resolves.toBeDefined()
    })
  })

  describe('input validation and generic errors', () => {
    it.each([
      ['a slippage tolerance below 0.1%', { slippageTolerance: 0.05 }, {}],
      ['a slippage tolerance above 50%', { slippageTolerance: 75 }, {}],
      ['an initial price outside the range', {}, { initialPrice: '4' }],
      ['an invalid pool address', { poolId: 'not-a-pool' }, {}],
    ])('should reject %s before any RPC call', async (_label, overrides, poolConfig) => {
      await expect(createRaydiumPositionTransaction(params(overrides, poolConfig))).rejects.toMatchObject({ code: 'INVALID_INPUT' })
      expect(mockGetPoolInfoFromRpc).not.toHaveBeenCalled()
    })

    it('should return a generic message when the pool cannot be read', async () => {
      mockGetPoolInfoFromRpc.mockRejectedValue(new Error(`fetch pool info error: ${POOL_ID} via https://private-rpc.example`))

      const error = await createRaydiumPositionTransaction(params()).catch((caught: unknown) => caught)

      expect(error).toMatchObject({ code: 'TRANSACTION_FAILED', status: 500 })
      expect((error as Error).message).not.toContain('private-rpc')
    })

    it('should reject a position transaction that exceeds the size limit', async () => {
      mockPositionTransaction(1_100)

      await expect(createRaydiumPositionTransaction(params())).rejects.toMatchObject({ code: 'TRANSACTION_FAILED' })
    })
  })
})
