/**
 * Tests for createRaydiumPositionTransaction — the CLMM position-opening step
 * that actually deposits liquidity (see createRaydiumPool.ts docstring for why
 * this is a separate function/transaction from pool creation).
 *
 * Focuses on:
 *  - Canonical mint-order handling: Raydium's SDK sorts a pool's mintA/mintB
 *    by ascending public key, which may differ from the user's tokenA/tokenB.
 *    Getting this wrong would silently open a position at the wrong price
 *    range or with amounts swapped between tokens.
 *  - Ephemeral NFT-mint signer partial-signing
 *  - Non-CLMM / missing price-range guards
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { getMint } from '@solana/spl-token'

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    rpcPrivateEndpoint: 'https://api.mainnet-beta.solana.com',
    feeWalletAddress: 'So11111111111111111111111111111111111111112',
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

const mockLegacyConnection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'test-blockhash-1234' }),
}

vi.mock('@/lib/solana', () => ({
  createConnectionPair: vi.fn(() => ({
    legacyConnection: mockLegacyConnection,
    kitRpc: {},
  })),
}))

vi.mock('@solana/spl-token', () => ({
  getMint: vi.fn().mockResolvedValue({
    decimals: 6,
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  }),
  TOKEN_PROGRAM_ID: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  TOKEN_2022_PROGRAM_ID: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
}))

const mockGetMint = vi.mocked(getMint)

const MOCK_WALLET = new PublicKey('So11111111111111111111111111111111111111112')
const MOCK_TOKEN_A = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const MOCK_TOKEN_B = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const MOCK_POOL_ID = 'PooLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'

const mockGetPoolInfoFromRpc = vi.fn()
const mockOpenPositionFromLiquidity = vi.fn()

// Deterministic stand-ins for the SDK's real math — this test verifies OUR
// canonical-order handling, not the SDK's tick/liquidity math itself.
vi.mock('@raydium-io/raydium-sdk-v2', () => ({
  Raydium: {
    load: vi.fn(async () => ({
      clmm: {
        getPoolInfoFromRpc: mockGetPoolInfoFromRpc,
        openPositionFromLiquidity: mockOpenPositionFromLiquidity,
      },
    })),
  },
  TxVersion: { LEGACY: 0 },
  API_URLS: {
    BASE_HOST: 'https://api-v3.raydium.io',
    CPMM_CONFIG: '/main/cpmm-config',
    CLMM_CONFIG: '/main/clmm-config',
  },
  TickMath: {
    getTickWithPriceAndTickspacing: vi.fn((price: { toNumber: () => number }) => Math.round(price.toNumber() * 100)),
  },
  SqrtPriceMath: {
    getSqrtPriceX64FromTick: vi.fn((tick: number) => ({ tick, kind: 'sqrtPriceX64FromTick' })),
    priceToSqrtPriceX64: vi.fn((price: { toNumber: () => number }) => ({ price: price.toNumber(), kind: 'currentSqrtPriceX64' })),
  },
  LiquidityMath: {
    getLiquidityFromTokenAmounts: vi.fn(() => ({ toString: () => '123456789' })),
  },
}))

const { createRaydiumPositionTransaction } = await import('../createRaydiumPool')

const basePoolInfo = (mintAAddress: string, mintBAddress: string) => ({
  price: 2.0,
  mintA: { address: mintAAddress, decimals: 6 },
  mintB: { address: mintBAddress, decimals: 6 },
  config: { tickSpacing: 10 },
})

const makeTxData = () => ({
  transaction: {
    serialize: vi.fn(() => Buffer.from('mock-position-tx')),
    partialSign: vi.fn(),
  },
  signers: [] as unknown[],
  extInfo: {
    address: { nftMint: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R') },
  },
})

const baseParams = (overrides = {}) => ({
  walletPublicKey: MOCK_WALLET,
  poolId: MOCK_POOL_ID,
  poolConfig: {
    poolType: 'CLMM' as const,
    tokenA: MOCK_TOKEN_A,
    tokenB: MOCK_TOKEN_B,
    feeTier: '0.05' as const,
    initialLiquidity: { amountA: '1000', amountB: '500' },
    priceRange: { minPrice: '1.5', maxPrice: '2.5' },
    ...overrides,
  },
})

describe('createRaydiumPositionTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLegacyConnection.getLatestBlockhash.mockResolvedValue({ blockhash: 'test-blockhash-1234' })
    mockGetMint.mockResolvedValue({
      decimals: 6,
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    } as unknown as Awaited<ReturnType<typeof getMint>>)
    mockOpenPositionFromLiquidity.mockResolvedValue(makeTxData())
  })

  it('uses amounts and price range as-is when the pool mintA matches the user tokenA (no swap)', async () => {
    mockGetPoolInfoFromRpc.mockResolvedValue({
      poolInfo: basePoolInfo(MOCK_TOKEN_A, MOCK_TOKEN_B),
      poolKeys: {},
    })

    await createRaydiumPositionTransaction(baseParams())

    const call = mockOpenPositionFromLiquidity.mock.calls[0][0]
    // amountA (1000, scaled) should map to amountMaxA when no swap occurred
    expect(call.amountMaxA.toString()).toBe('1000000000') // 1000 * 10^6
    expect(call.amountMaxB.toString()).toBe('500000000') // 500 * 10^6
  })

  it('swaps amounts and inverts the price range when the pool mintA is the user tokenB (swap detected)', async () => {
    // poolInfo.mintA is the user's tokenB — the SDK canonicalised in the opposite order
    mockGetPoolInfoFromRpc.mockResolvedValue({
      poolInfo: basePoolInfo(MOCK_TOKEN_B, MOCK_TOKEN_A),
      poolKeys: {},
    })

    await createRaydiumPositionTransaction(baseParams())

    const call = mockOpenPositionFromLiquidity.mock.calls[0][0]
    // amountMaxA (canonical) should now be the user's amountB, and vice versa
    expect(call.amountMaxA.toString()).toBe('500000000')
    expect(call.amountMaxB.toString()).toBe('1000000000')
  })

  it('partially signs the position transaction with ephemeral signers before returning it', async () => {
    mockGetPoolInfoFromRpc.mockResolvedValue({
      poolInfo: basePoolInfo(MOCK_TOKEN_A, MOCK_TOKEN_B),
      poolKeys: {},
    })
    const txData = makeTxData()
    const fakeSigner = { publicKey: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R') }
    txData.signers = [fakeSigner]
    mockOpenPositionFromLiquidity.mockResolvedValue(txData)

    const result = await createRaydiumPositionTransaction(baseParams())

    expect(txData.transaction.partialSign).toHaveBeenCalledWith(fakeSigner)
    expect(result.positionNftMint).toBe('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R')
    expect(typeof result.serializedTransaction).toBe('string')
    expect(result.estimatedCosts.positionOpening).toBeGreaterThan(0)
  })

  it('does not call partialSign when there are no ephemeral signers', async () => {
    mockGetPoolInfoFromRpc.mockResolvedValue({
      poolInfo: basePoolInfo(MOCK_TOKEN_A, MOCK_TOKEN_B),
      poolKeys: {},
    })
    const txData = makeTxData()
    mockOpenPositionFromLiquidity.mockResolvedValue(txData)

    await createRaydiumPositionTransaction(baseParams())

    expect(txData.transaction.partialSign).not.toHaveBeenCalled()
  })

  it('requests the Token-2022 NFT method (cheaper than legacy SPL + Metaplex)', async () => {
    mockGetPoolInfoFromRpc.mockResolvedValue({
      poolInfo: basePoolInfo(MOCK_TOKEN_A, MOCK_TOKEN_B),
      poolKeys: {},
    })

    await createRaydiumPositionTransaction(baseParams())

    const call = mockOpenPositionFromLiquidity.mock.calls[0][0]
    expect(call.nft2022).toBe(true)
  })

  it('rejects non-CLMM pool types', async () => {
    await expect(createRaydiumPositionTransaction(baseParams({ poolType: 'CPMM' as unknown as 'CLMM' }))).rejects.toThrow(/CLMM/)
  })

  it('rejects when priceRange is missing', async () => {
    const params = baseParams()
    // @ts-expect-error - intentionally testing the missing-priceRange guard
    delete params.poolConfig.priceRange

    await expect(createRaydiumPositionTransaction(params)).rejects.toThrow(/priceRange/)
  })

  it('rejects when tickLower would not be less than tickUpper', async () => {
    mockGetPoolInfoFromRpc.mockResolvedValue({
      poolInfo: basePoolInfo(MOCK_TOKEN_A, MOCK_TOKEN_B),
      poolKeys: {},
    })

    // minPrice > maxPrice produces tickLower >= tickUpper with our stub tick math
    await expect(createRaydiumPositionTransaction(baseParams({ priceRange: { minPrice: '5', maxPrice: '2' } }))).rejects.toThrow(
      /Max Price must be greater/
    )
  })

  it('wraps SDK failures in AppError', async () => {
    mockGetPoolInfoFromRpc.mockRejectedValue(new Error('RPC unavailable'))

    await expect(createRaydiumPositionTransaction(baseParams())).rejects.toThrow(/Failed to open CLMM position/)
  })
})
