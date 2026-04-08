/**
 * useLiquidityProvider Hook Tests
 *
 * Tests the business logic of the liquidity provider hook:
 * - Token B resolution (SOL/USDC/USDT/custom)
 * - CLMM price range validation
 * - API request payload shape
 *
 * Uses Vitest with node environment — tests the exported helpers
 * and uses vi.mock for dependency isolation.
 */

import { describe, it, expect, vi } from 'vitest'

// --- Mocks must come before imports ---

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: true,
    publicKey: {
      toString: () => 'TestWallet111111111111111111111111111111111',
      toBase58: () => 'TestWallet111111111111111111111111111111111',
    },
    signTransaction: vi.fn((tx: unknown) => Promise.resolve(tx)),
  })),
  useConnection: vi.fn(() => ({
    connection: {
      sendRawTransaction: vi.fn().mockResolvedValue('MockSig'),
      getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'TestBlockhash', lastValidBlockHeight: 100 }),
      getSignatureStatus: vi.fn().mockResolvedValue(null),
      getBalance: vi.fn().mockResolvedValue(10_000_000_000),
    },
  })),
}))

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: vi.fn(),
}))

vi.mock('@/lib/solana', () => ({
  confirmTransactionWithParallelStrategy: vi.fn().mockResolvedValue({ confirmed: true, slot: 1, err: null }),
  createConnectionPair: vi.fn(() => ({ kitRpc: {} })),
}))

vi.mock('@/lib/solana/validateBalance', () => ({
  validateBalance: vi.fn().mockResolvedValue({
    hasSufficientBalance: true,
    estimatedCost: 0.05,
    currentBalance: 10,
  }),
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({
  showTransactionToast: vi.fn(),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock('@solana/web3.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/web3.js')>()
  class MockTransaction {
    recentBlockhash: string | undefined
    static from(data: unknown) {
      void data
      return new MockTransaction()
    }
    serialize() {
      return Buffer.from('signed-tx')
    }
  }
  return {
    ...actual,
    Transaction: MockTransaction,
    PublicKey: actual.PublicKey,
    LAMPORTS_PER_SOL: actual.LAMPORTS_PER_SOL,
  }
})

// --- Import helpers under test ---

import { TOKEN_B_MINT_ADDRESSES, resolveTokenBAddress, buildLiquidityRequest } from '../useLiquidityProvider'
import type { LiquidityProviderParams } from '@/types/liquidityProvider'

// --- Shared test data ---

const WALLET = 'TestWallet111111111111111111111111111111111'

const cpmmParams: LiquidityProviderParams = {
  poolType: 'CPMM',
  tokenA: 'TokenAMint111111111111111111111111111111111111',
  tokenB: 'SOL',
  amountA: '100',
  amountB: '1',
  feeTier: '0.25',
  slippageTolerance: '0.5',
  deadline: '20',
  platformFee: '0.001',
}

const clmmParams: LiquidityProviderParams = {
  poolType: 'CLMM',
  tokenA: 'TokenAMint111111111111111111111111111111111111',
  tokenB: 'USDC',
  amountA: '100',
  amountB: '50',
  feeTier: '0.05',
  slippageTolerance: '0.5',
  minPrice: '0.01',
  maxPrice: '10.00',
  deadline: '20',
  platformFee: '0.001',
}

// --- TOKEN_B_MINT_ADDRESSES ---

describe('TOKEN_B_MINT_ADDRESSES', () => {
  it('should contain wrapped SOL mint address', () => {
    expect(TOKEN_B_MINT_ADDRESSES.SOL).toBe('So11111111111111111111111111111111111111112')
  })

  it('should contain USDC mint address', () => {
    expect(TOKEN_B_MINT_ADDRESSES.USDC).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  })

  it('should contain USDT mint address', () => {
    expect(TOKEN_B_MINT_ADDRESSES.USDT).toBe('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')
  })
})

// --- resolveTokenBAddress ---

describe('resolveTokenBAddress', () => {
  it('should resolve SOL to wrapped SOL mint', () => {
    expect(resolveTokenBAddress('SOL')).toBe(TOKEN_B_MINT_ADDRESSES.SOL)
  })

  it('should resolve USDC to USDC mint', () => {
    expect(resolveTokenBAddress('USDC')).toBe(TOKEN_B_MINT_ADDRESSES.USDC)
  })

  it('should resolve USDT to USDT mint', () => {
    expect(resolveTokenBAddress('USDT')).toBe(TOKEN_B_MINT_ADDRESSES.USDT)
  })

  it('should resolve custom to provided address', () => {
    const customMint = 'CustomMint1111111111111111111111111111111111'
    expect(resolveTokenBAddress('custom', customMint)).toBe(customMint)
  })

  it('should return null for custom without a customTokenB address', () => {
    expect(resolveTokenBAddress('custom', undefined)).toBeNull()
  })
})

// --- buildLiquidityRequest ---

describe('buildLiquidityRequest', () => {
  it('should build correct CPMM request without priceRange', () => {
    const tokenBAddress = TOKEN_B_MINT_ADDRESSES.SOL
    const request = buildLiquidityRequest(cpmmParams, WALLET, tokenBAddress)

    expect(request).toEqual({
      walletAddress: WALLET,
      poolConfig: {
        poolType: 'CPMM',
        tokenA: cpmmParams.tokenA,
        tokenB: TOKEN_B_MINT_ADDRESSES.SOL,
        feeTier: '0.25',
        initialLiquidity: {
          amountA: '100',
          amountB: '1',
        },
      },
      platformFee: '0.001',
    })

    expect(request.poolConfig).not.toHaveProperty('priceRange')
  })

  it('should build correct CLMM request with priceRange', () => {
    const tokenBAddress = TOKEN_B_MINT_ADDRESSES.USDC
    const request = buildLiquidityRequest(clmmParams, WALLET, tokenBAddress)

    expect(request.poolConfig.poolType).toBe('CLMM')
    expect(request.poolConfig.priceRange).toEqual({
      minPrice: '0.01',
      maxPrice: '10.00',
    })
  })

  it('should omit platformFee from request when it is undefined', () => {
    const params = { ...cpmmParams, platformFee: '' }
    const request = buildLiquidityRequest(params, WALLET, TOKEN_B_MINT_ADDRESSES.SOL)

    expect(request.platformFee).toBeUndefined()
  })
})

// --- Import and test the hook module exports existence ---

describe('useLiquidityProvider module', () => {
  it('should export useLiquidityProvider as a function', async () => {
    const mod = await import('../useLiquidityProvider')
    expect(mod.useLiquidityProvider).toBeTypeOf('function')
  })
})

// --- Validate CLMM guard logic ---

describe('CLMM price range validation (buildLiquidityRequest)', () => {
  it('should include priceRange only when both minPrice and maxPrice are defined', () => {
    const withBothPrices = buildLiquidityRequest(clmmParams, WALLET, TOKEN_B_MINT_ADDRESSES.USDC)
    expect(withBothPrices.poolConfig.priceRange).toBeDefined()

    const withMissingMin = buildLiquidityRequest({ ...clmmParams, minPrice: undefined }, WALLET, TOKEN_B_MINT_ADDRESSES.USDC)
    expect(withMissingMin.poolConfig.priceRange).toBeUndefined()

    const withMissingMax = buildLiquidityRequest({ ...clmmParams, maxPrice: undefined }, WALLET, TOKEN_B_MINT_ADDRESSES.USDC)
    expect(withMissingMax.poolConfig.priceRange).toBeUndefined()
  })
})
