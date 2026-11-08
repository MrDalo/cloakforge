/**
 * Unit tests for createRaydiumPoolTransaction with a mocked Raydium SDK: platform fee and coupon
 * instructions (WEB3-05), CLMM initial price (WEB3-06), CPMM fee-tier selection and generic
 * client errors (WEB3-13). Transaction sizes with the real SDK are covered in
 * createRaydiumPool.size.test.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  type AccountInfo,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import type Decimal from 'decimal.js'
import { AppError } from '@/lib/errors'
import { mintAccountInfo, mintExtension, tokenAccountInfo } from '@/__tests__/utils/mintAccountFixtures'
import type { CreateRaydiumPoolParams } from '../createRaydiumPool'

const FEE_WALLET = Keypair.generate().publicKey
const serverConfig = { rpcPrivateEndpoint: 'https://private-rpc.example', feeWalletAddress: FEE_WALLET.toBase58() }
vi.mock('@/lib/config/getServerConfig', () => ({ default: vi.fn(() => serverConfig) }))

const mockGetCachedToolConfig = vi.fn()
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: (...args: unknown[]) => mockGetCachedToolConfig(...args),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

const WALLET = Keypair.generate().publicKey
const TOKEN_A = Keypair.generate().publicKey
const TOKEN_B = new PublicKey('So11111111111111111111111111111111111111112')

let mintAccounts: Record<string, AccountInfo<Buffer> | null>
const legacyConnection = {
  getEpochInfo: vi.fn(async () => ({ epoch: 700, slotIndex: 1_000, slotsInEpoch: 432_000, absoluteSlot: 302_401_000 })),
  getMultipleAccountsInfo: vi.fn(async (keys: PublicKey[]) => keys.map((key) => mintAccounts[key.toBase58()] ?? null)),
  getLatestBlockhash: vi.fn(async () => ({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 100 })),
}
vi.mock('@/lib/solana', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/solana')>()),
  createConnectionPair: vi.fn(() => ({ legacyConnection, kitRpc: {} })),
}))

const mockCpmmCreatePool = vi.fn()
const mockClmmCreatePool = vi.fn()
vi.mock('@raydium-io/raydium-sdk-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@raydium-io/raydium-sdk-v2')>()),
  Raydium: {
    load: vi.fn(async () => ({ cpmm: { createPool: mockCpmmCreatePool }, clmm: { createPool: mockClmmCreatePool } })),
  },
}))

const { createRaydiumPoolTransaction, MAX_RAYDIUM_TRANSACTION_SIZE } = await import('../createRaydiumPool')

/** Live-shaped Raydium config lists (several CPMM configs share the 0.25% rate). */
const CPMM_CONFIGS = [
  {
    id: 'D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2',
    index: 0,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    fundFeeRate: 40000,
    createPoolFee: '150000000',
  },
  {
    id: 'LNmHRmMvk9kmtepfTSr98kqGLThd61kH1DPWf2cVRaC',
    index: 9,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    fundFeeRate: 40000,
    createPoolFee: '150000000',
  },
  {
    id: 'G95xxie3XbkCqtE39GgQ9Ggc7xBC8Uceve7HFDEFApkc',
    index: 1,
    protocolFeeRate: 120000,
    tradeFeeRate: 10000,
    fundFeeRate: 40000,
    createPoolFee: '150000000',
  },
]
const CLMM_CONFIGS = [
  {
    id: '3XCQJQryqpDvvZBfGxR7CLAw5dpGJ9aa7kt1jRLdyxuZ',
    index: 5,
    protocolFeeRate: 120000,
    tradeFeeRate: 500,
    tickSpacing: 1,
    fundFeeRate: 40000,
  },
  {
    id: 'E64NGkDLLCdQ2yFNPcavaKptrEgmiQaNykUuLC1Qgwyp',
    index: 1,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    tickSpacing: 60,
    fundFeeRate: 40000,
  },
]

const configFetch = vi.fn(async (url: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ data: url.includes('cpmm-config') ? CPMM_CONFIGS : CLMM_CONFIGS }),
}))

const POOL_ID = Keypair.generate().publicKey
/** Stand-in for the SDK's pool instructions. */
const raydiumInstruction = new TransactionInstruction({
  programId: new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C'),
  keys: [{ pubkey: WALLET, isSigner: true, isWritable: true }],
  data: Buffer.from([1, 2, 3]),
})
const sdkResult = () => ({
  transaction: new Transaction().add(raydiumInstruction),
  signers: [],
  extInfo: { address: { poolId: POOL_ID, id: POOL_ID.toBase58() } },
})

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
const memoText = (ix: TransactionInstruction): string => Buffer.from(ix.data).toString('utf8')
const couponMemo = new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from('coupon:abc123') })
const couponMarker = SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: Keypair.generate().publicKey, lamports: 0 })

const cpmmParams = (poolConfig: Partial<CreateRaydiumPoolParams['poolConfig']> = {}, couponCode?: string): CreateRaydiumPoolParams => ({
  walletPublicKey: WALLET,
  couponCode,
  poolConfig: {
    poolType: 'CPMM',
    tokenA: TOKEN_A.toBase58(),
    tokenB: TOKEN_B.toBase58(),
    feeTier: '0.25',
    initialLiquidity: { amountA: '1000', amountB: '0.5' },
    ...poolConfig,
  },
})

const clmmParams = (poolConfig: Partial<CreateRaydiumPoolParams['poolConfig']> = {}): CreateRaydiumPoolParams =>
  cpmmParams({ poolType: 'CLMM', feeTier: '0.05', priceRange: { minPrice: '1', maxPrice: '3' }, initialPrice: '2', ...poolConfig })

const decodeTransaction = (base64: string): Transaction => Transaction.from(Buffer.from(base64, 'base64'))

/** Platform fee transfers to the fee wallet in a transaction (lamports). */
const feeTransfers = (transaction: Transaction): number[] =>
  transaction.instructions
    .filter((ix) => ix.programId.equals(SystemProgram.programId))
    .map((ix) => SystemInstruction.decodeTransfer(ix))
    .filter((transfer) => transfer.toPubkey.equals(FEE_WALLET))
    .map((transfer) => Number(transfer.lamports))

describe('createRaydiumPoolTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serverConfig.feeWalletAddress = FEE_WALLET.toBase58()
    vi.stubGlobal('fetch', configFetch)
    mintAccounts = {
      [TOKEN_A.toBase58()]: mintAccountInfo({ decimals: 6 }),
      [TOKEN_B.toBase58()]: mintAccountInfo({ decimals: 9 }),
    }
    mockGetCachedToolConfig.mockResolvedValue({ baseFee: 0.1 })
    mockApplyCouponToServiceFee.mockImplementation(async (fee: number) => ({ feeSOL: fee, couponInstructions: [] }))
    mockCpmmCreatePool.mockImplementation(async () => sdkResult())
    mockClmmCreatePool.mockImplementation(async () => sdkResult())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('platform fee (WEB3-05)', () => {
    it('should charge the configured platform fee to the fee wallet in the pool-creation transaction', async () => {
      const result = await createRaydiumPoolTransaction(cpmmParams())
      const transaction = decodeTransaction(result.serializedTransaction)

      expect(mockGetCachedToolConfig).toHaveBeenCalledWith('liquidity-provider')
      expect(feeTransfers(transaction)).toEqual([0.1 * LAMPORTS_PER_SOL])
      expect(result.estimatedCosts.platformFee).toBe(0.1)
      // service memo, fee transfer, then the Raydium instructions — all atomic
      expect(memoText(transaction.instructions[0])).toBe('liquidity-provider-service:create:CPMM')
      expect(transaction.instructions[1].programId.equals(SystemProgram.programId)).toBe(true)
      expect(transaction.instructions[2].programId.equals(raydiumInstruction.programId)).toBe(true)
      expect(transaction.feePayer?.equals(WALLET)).toBe(true)
      expect(result.poolPublicKey).toBe(POOL_ID.toBase58())
    })

    it('should charge the hard-coded minimum fee when the tool configuration is unavailable', async () => {
      mockGetCachedToolConfig.mockRejectedValue(new Error('contentful down'))

      const result = await createRaydiumPoolTransaction(cpmmParams())

      expect(feeTransfers(decodeTransaction(result.serializedTransaction))).toEqual([0.1 * LAMPORTS_PER_SOL])
    })

    it('should apply the coupon and add its memo and marker transfer before the discounted fee', async () => {
      mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.05, couponInstructions: [couponMemo, couponMarker] })

      const result = await createRaydiumPoolTransaction(cpmmParams({}, 'SAVE50'))
      const transaction = decodeTransaction(result.serializedTransaction)

      expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(0.1, 'SAVE50', WALLET)
      expect(memoText(transaction.instructions[1])).toBe('coupon:abc123')
      expect(SystemInstruction.decodeTransfer(transaction.instructions[2]).toPubkey.equals(couponMarker.keys[1].pubkey)).toBe(true)
      expect(feeTransfers(transaction)).toEqual([0.05 * LAMPORTS_PER_SOL])
      expect(result.estimatedCosts.platformFee).toBe(0.05)
    })

    it('should keep the coupon instructions but skip the fee transfer for a 100% coupon', async () => {
      mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponInstructions: [couponMemo, couponMarker] })

      const result = await createRaydiumPoolTransaction(cpmmParams({}, 'FREE01'))
      const transaction = decodeTransaction(result.serializedTransaction)

      expect(feeTransfers(transaction)).toEqual([])
      expect(transaction.instructions.some((ix) => ix.programId.equals(MEMO_PROGRAM_ID) && memoText(ix) === 'coupon:abc123')).toBe(true)
    })

    it('should surface coupon errors unchanged and build nothing', async () => {
      mockApplyCouponToServiceFee.mockRejectedValue(new AppError('INVALID_INPUT', 'Discount coupon is invalid or no longer available', 400))

      await expect(createRaydiumPoolTransaction(cpmmParams({}, 'BADONE'))).rejects.toMatchObject({
        code: 'INVALID_INPUT',
        message: 'Discount coupon is invalid or no longer available',
      })
      expect(mockCpmmCreatePool).not.toHaveBeenCalled()
    })

    it('should refuse to build an unpaid transaction when the fee wallet is misconfigured', async () => {
      serverConfig.feeWalletAddress = 'not-a-wallet'

      await expect(createRaydiumPoolTransaction(cpmmParams())).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE', status: 503 })
    })
  })

  describe('CPMM fee tier (WEB3-13)', () => {
    it('should create the pool with the Raydium config matching the chosen tier', async () => {
      await createRaydiumPoolTransaction(cpmmParams({ feeTier: '0.25' }))
      expect(mockCpmmCreatePool.mock.calls[0][0].feeConfig).toMatchObject({ id: CPMM_CONFIGS[0].id, tradeFeeRate: 2_500 })

      await createRaydiumPoolTransaction(cpmmParams({ feeTier: '1.00' }))
      expect(mockCpmmCreatePool.mock.calls[1][0].feeConfig).toMatchObject({ id: CPMM_CONFIGS[2].id, tradeFeeRate: 10_000 })
    })

    it('should reject a tier Raydium does not offer for CPMM pools', async () => {
      await expect(createRaydiumPoolTransaction(cpmmParams({ feeTier: '0.05' }))).rejects.toMatchObject({ code: 'INVALID_INPUT' })
      expect(mockCpmmCreatePool).not.toHaveBeenCalled()
    })
  })

  describe('on-chain mint data', () => {
    it('should read both mints in one request and pass on-chain decimals and token programs to the SDK', async () => {
      mintAccounts[TOKEN_A.toBase58()] = mintAccountInfo({ decimals: 9, program: 'token-2022' })

      await createRaydiumPoolTransaction(cpmmParams({ initialLiquidity: { amountA: '1.5', amountB: '0.25' } }))

      expect(legacyConnection.getMultipleAccountsInfo).toHaveBeenCalledTimes(1)
      const call = mockCpmmCreatePool.mock.calls[0][0]
      expect(call.mintA).toEqual({ address: TOKEN_A.toBase58(), decimals: 9, programId: TOKEN_2022_PROGRAM_ID.toBase58() })
      expect(call.mintB).toEqual({ address: TOKEN_B.toBase58(), decimals: 9, programId: TOKEN_PROGRAM_ID.toBase58() })
      expect(call.mintAAmount.toString()).toBe('1500000000')
      expect(call.mintBAmount.toString()).toBe('250000000')
      expect(call.programId.toBase58()).toBe('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C')
      expect(call.poolFeeAccount.toBase58()).toBe('DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8')
    })

    it('should reject a missing mint or an account that is not a mint', async () => {
      mintAccounts[TOKEN_A.toBase58()] = null
      await expect(createRaydiumPoolTransaction(cpmmParams())).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })

      mintAccounts[TOKEN_A.toBase58()] = tokenAccountInfo(TOKEN_B, WALLET, BigInt(1))
      await expect(createRaydiumPoolTransaction(cpmmParams())).rejects.toMatchObject({ code: 'INVALID_MINT' })
    })

    it('should reject an amount with more decimals than the mint supports', async () => {
      await expect(
        createRaydiumPoolTransaction(cpmmParams({ initialLiquidity: { amountA: '1.1234567', amountB: '1' } }))
      ).rejects.toBeInstanceOf(AppError)
      expect(mockCpmmCreatePool).not.toHaveBeenCalled()
    })
  })

  describe('CLMM pool (WEB3-06)', () => {
    it('should open the pool at the initial price, not at the range minimum, with the matching AMM config', async () => {
      const result = await createRaydiumPoolTransaction(clmmParams())

      const call = mockClmmCreatePool.mock.calls[0][0]
      expect((call.initialPrice as Decimal).toString()).toBe('2')
      expect(call.ammConfig.id).toBeInstanceOf(PublicKey)
      expect(call.ammConfig.id.toBase58()).toBe(CLMM_CONFIGS[0].id)
      expect(call.mint1).toMatchObject({ address: TOKEN_A.toBase58(), decimals: 6 })
      expect(call.mint2).toMatchObject({ address: TOKEN_B.toBase58(), decimals: 9 })

      // The fee is charged in the pool-creation transaction (the first of the two CLMM transactions)
      const transaction = decodeTransaction(result.serializedTransaction)
      expect(memoText(transaction.instructions[0])).toBe('liquidity-provider-service:create:CLMM')
      expect(feeTransfers(transaction)).toEqual([0.1 * LAMPORTS_PER_SOL])
      expect(result.estimatedCosts.poolCreation).toBe(0.06)
    })

    it.each([
      ['without an initial price', { initialPrice: undefined }],
      ['with an initial price outside the range', { initialPrice: '5' }],
    ])('should reject a CLMM pool %s before any RPC call', async (_label, overrides) => {
      await expect(createRaydiumPoolTransaction(clmmParams(overrides))).rejects.toMatchObject({ code: 'INVALID_INPUT' })
      expect(legacyConnection.getMultipleAccountsInfo).not.toHaveBeenCalled()
    })
  })

  describe('CLMM with a Token-2022 transfer fee mint', () => {
    const withTransferFee = (basisPoints: number, maximumFee: bigint) =>
      mintAccountInfo({
        decimals: 6,
        extensions: [
          mintExtension.transferFeeConfig({ authority: null, older: { basisPoints, maximumFee }, newer: { basisPoints, maximumFee } }),
        ],
      })

    it('should create the pool for a fee-bearing mint, leaving the fee to the position step', async () => {
      mintAccounts[TOKEN_A.toBase58()] = withTransferFee(100, BigInt(10_000_000))

      const result = await createRaydiumPoolTransaction(clmmParams())

      expect(legacyConnection.getEpochInfo).toHaveBeenCalledTimes(1)
      expect(mockClmmCreatePool).toHaveBeenCalledTimes(1)
      expect(feeTransfers(decodeTransaction(result.serializedTransaction))).toEqual([0.1 * LAMPORTS_PER_SOL])
    })

    it('should reject, before any platform fee is built, an amount that the transfer fee consumes entirely', async () => {
      // 100% fee with a cap above the whole 1000-token amount (1000 × 10^6 base units)
      mintAccounts[TOKEN_A.toBase58()] = withTransferFee(10_000, BigInt(10_000_000_000))

      await expect(createRaydiumPoolTransaction(clmmParams())).rejects.toMatchObject({
        code: 'INVALID_INPUT',
        message: expect.stringContaining('transfer fee'),
      })
      expect(mockClmmCreatePool).not.toHaveBeenCalled()
      expect(legacyConnection.getLatestBlockhash).not.toHaveBeenCalled()
    })

    it('should not read the epoch for mints without a transfer fee', async () => {
      await createRaydiumPoolTransaction(clmmParams())

      expect(legacyConnection.getEpochInfo).not.toHaveBeenCalled()
    })
  })

  describe('input validation and generic errors', () => {
    it('should reject a pool of a token with itself before any RPC call', async () => {
      await expect(createRaydiumPoolTransaction(cpmmParams({ tokenB: TOKEN_A.toBase58() }))).rejects.toMatchObject({
        code: 'INVALID_INPUT',
      })
      expect(legacyConnection.getMultipleAccountsInfo).not.toHaveBeenCalled()
    })

    it('should never echo raw SDK errors to the client', async () => {
      mockCpmmCreatePool.mockRejectedValue(new Error('you don’t has some token account (owner 9xQe…, rpc https://private-rpc.example)'))

      const error = await createRaydiumPoolTransaction(cpmmParams()).catch((caught: unknown) => caught)

      expect(error).toMatchObject({ code: 'TRANSACTION_FAILED', status: 500 })
      expect((error as Error).message).toBe(
        'Failed to prepare the CPMM pool transaction. Check that your wallet holds both tokens and try again.'
      )
    })

    it('should fail closed when the SDK unexpectedly requires extra signers', async () => {
      mockCpmmCreatePool.mockResolvedValue({ ...sdkResult(), signers: [Keypair.generate()] })

      await expect(createRaydiumPoolTransaction(cpmmParams())).rejects.toMatchObject({ code: 'TRANSACTION_FAILED' })
    })

    it(`should reject a transaction larger than ${MAX_RAYDIUM_TRANSACTION_SIZE} bytes`, async () => {
      const oversized = new TransactionInstruction({ programId: raydiumInstruction.programId, keys: [], data: Buffer.alloc(1_000) })
      mockCpmmCreatePool.mockResolvedValue({ ...sdkResult(), transaction: new Transaction().add(oversized) })

      await expect(createRaydiumPoolTransaction(cpmmParams())).rejects.toMatchObject({ code: 'TRANSACTION_FAILED' })
    })

    it('should report Raydium config outages as a generic 503', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))
      )

      await expect(createRaydiumPoolTransaction(cpmmParams())).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE', status: 503 })
    })
  })
})
