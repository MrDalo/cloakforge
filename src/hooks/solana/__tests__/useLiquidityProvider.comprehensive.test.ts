/**
 * useLiquidityProvider Comprehensive Hook Tests
 *
 * Tests utility functions (pure, no React needed) and the hook itself via
 * renderHook.  The hook uses useToolBase (useState-based), NOT a TanStack
 * Query mutation, so we check `isExecuting` / `lastResult` rather than
 * React Query's `isSuccess` / `isError`.
 *
 * Environment: jsdom (needed for renderHook + React 19)
 */
// @vitest-environment jsdom

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/dom'
import { renderHook, act } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Wallet addresses — must be valid base58 (no 0, O, I, l characters)
// ---------------------------------------------------------------------------
// Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
const VALID_WALLET = 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB8n3TFVdioGz'

// --- Mocks must be hoisted before any imports that trigger the mocked modules ---

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: true,
    publicKey: {
      toString: () => VALID_WALLET,
      toBase58: () => VALID_WALLET,
    },
    signTransaction: vi.fn((tx: unknown) => Promise.resolve(tx)),
    signAllTransactions: vi.fn((txs: unknown[]) => Promise.resolve(txs)),
    wallet: { adapter: { name: 'Test Wallet' } },
    connecting: false,
    disconnecting: false,
    disconnect: vi.fn(),
  })),
  useConnection: vi.fn(() => ({
    connection: {
      sendRawTransaction: vi.fn().mockResolvedValue('MockSignature111111111111111111111111111111'),
      getLatestBlockhash: vi
        .fn()
        .mockResolvedValue({ blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N', lastValidBlockHeight: 100 }),
      getSignatureStatus: vi.fn().mockResolvedValue(null),
      getBalance: vi.fn().mockResolvedValue(10_000_000_000),
    },
  })),
}))

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: vi.fn().mockResolvedValue({
    serializedTransaction:
      'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
    poolPublicKey: 'PoolKey111111111111111111111111111111111111',
    estimatedCosts: {
      poolCreation: 0.02039,
      platformFee: 0.1,
      networkFee: 0.000005,
    },
    message: 'Pool creation transaction prepared successfully',
  }),
}))

const verification = vi.hoisted(() => ({
  verifyBeforeSigning: vi.fn(),
  fetchRaydiumPoolMints: vi.fn(),
  feeWallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
}))

// The real verifier decodes transactions with web3.js layouts (broken under jsdom and by the web3.js mock
// below): it is tested in src/lib/solana/client/__tests__; here it is a mock so the tests can show that
// signing depends on it
vi.mock('@/lib/solana/client', async () => {
  const { AppError } = await import('@/lib/errors')
  return {
    getMaxServiceFeeLamports: (await import('./fixtures/serviceFeeLimitMock')).getMaxServiceFeeLamportsMock,
    solToLamportsCeil: (sol: number) => BigInt(Math.ceil(sol * 1e9)),
    verifyBeforeSigning: (...args: unknown[]) => verification.verifyBeforeSigning(...args),
    resolveFeeWalletForVerification: () => verification.feeWallet,
    // Stand-in for the real derivation (tested in src/lib/solana/client/__tests__, where web3.js hashing works):
    // deterministic per (pool type, fee tier, tokens), like the real one, and failing for the same CPMM fee tiers
    deriveRaydiumPoolAddress: ({ poolType, feeTier, tokenA, tokenB }: Record<string, string>) => {
      if (poolType === 'CPMM' && (feeTier === '0.01' || feeTier === '0.05')) {
        throw new AppError('INVALID_INPUT', 'Raydium does not offer this fee tier for CPMM pools')
      }
      return `${poolType}-${feeTier}-${tokenA}-${tokenB}`
    },
    fetchRaydiumPoolMints: (...args: unknown[]) => verification.fetchRaydiumPoolMints(...args),
  }
})

vi.mock('@/lib/solana', () => ({
  confirmTransactionWithParallelStrategy: vi.fn().mockResolvedValue({
    confirmed: true,
    slot: 1,
    err: null,
  }),
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
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}))

// Mock @solana/kit's address() validator to accept any string (test addresses
// are intentionally short/simple and may not be valid base58)
vi.mock('@solana/kit', () => ({
  address: vi.fn((addr: string) => addr),
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

  // Wrap real PublicKey so it passes on the valid addresses used in tests
  return {
    ...actual,
    Transaction: MockTransaction,
    PublicKey: actual.PublicKey,
    LAMPORTS_PER_SOL: actual.LAMPORTS_PER_SOL,
  }
})

// --- Imports under test (after mocks) ---

import {
  TOKEN_B_MINT_ADDRESSES,
  getMaxWrappedSolLamports,
  resolveTokenBAddress,
  buildLiquidityRequest,
  useLiquidityProvider,
} from '../useLiquidityProvider'
import { AppError } from '@/lib/errors'
import { useDiscountCouponStore } from '@/stores/discountCouponStore'
import { mockFormData, MOCK_ADDRESSES, mockLiquidityProviderParams, mockLiquidityProviderParamsCLMM } from '@/__tests__/utils/mockData'
import { validateBalance } from '@/lib/solana/validateBalance'
import { apiClient } from '@/lib/utils/apiClient'
import { confirmTransactionWithParallelStrategy } from '@/lib/solana'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { deriveRaydiumPoolAddress } from '@/lib/solana/client'

// ---------------------------------------------------------------------------
// Wrapper — plain fragment, hook uses useState not TanStack Query
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children)

// The pools the form params produce; the hook derives them itself and refuses any other announced pool
const CPMM_POOL = deriveRaydiumPoolAddress({
  poolType: 'CPMM',
  feeTier: mockLiquidityProviderParams.feeTier,
  tokenA: mockLiquidityProviderParams.tokenA,
  tokenB: TOKEN_B_MINT_ADDRESSES.SOL,
})
const CLMM_POOL = deriveRaydiumPoolAddress({
  poolType: 'CLMM',
  feeTier: mockLiquidityProviderParamsCLMM.feeTier,
  tokenA: mockLiquidityProviderParamsCLMM.tokenA,
  tokenB: TOKEN_B_MINT_ADDRESSES.USDT,
})
const ATTACKER_POOL = 'ATTACKERPooL1111111111111111111111111111111'

/** What the client reads on-chain for the mints of the form params (decimals and token programs). */
const MINT_INFO = {
  tokenA: { decimals: 6, tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
  tokenB: { decimals: 9, tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
}

// ---------------------------------------------------------------------------
// Helper to reset mocks to default happy-path state
// ---------------------------------------------------------------------------

function resetToDefaultMocks() {
  verification.verifyBeforeSigning.mockResolvedValue({})
  verification.fetchRaydiumPoolMints.mockResolvedValue(MINT_INFO)
  useDiscountCouponStore.setState({ appliedCoupon: null, error: null, isValidating: false })
  const mockUseWallet = vi.mocked(useWallet)
  const mockUseConnection = vi.mocked(useConnection)
  const mockValidateBalance = vi.mocked(validateBalance)
  const mockApiClient = vi.mocked(apiClient)
  const mockConfirm = vi.mocked(confirmTransactionWithParallelStrategy)

  mockUseWallet.mockReturnValue({
    connected: true,
    publicKey: {
      toString: () => VALID_WALLET,
      toBase58: () => VALID_WALLET,
    } as unknown as import('@solana/web3.js').PublicKey,
    signTransaction: vi.fn((tx: unknown) => Promise.resolve(tx as import('@solana/web3.js').Transaction)),
    signAllTransactions: vi.fn((txs: unknown[]) => Promise.resolve(txs as import('@solana/web3.js').Transaction[])),
    wallet: null,
    wallets: [],
    select: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendTransaction: vi.fn(),
    connecting: false,
    disconnecting: false,
    autoConnect: false,
    signMessage: undefined,
    signIn: undefined,
  } as unknown as import('@solana/wallet-adapter-react').WalletContextState)

  mockUseConnection.mockReturnValue({
    connection: {
      sendRawTransaction: vi.fn().mockResolvedValue('MockSignature111111111111111111111111111111'),
      getLatestBlockhash: vi
        .fn()
        .mockResolvedValue({ blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N', lastValidBlockHeight: 100 }),
      getSignatureStatus: vi.fn().mockResolvedValue(null),
      getBalance: vi.fn().mockResolvedValue(10_000_000_000),
    } as unknown as import('@solana/web3.js').Connection,
  })

  mockValidateBalance.mockResolvedValue({
    hasSufficientBalance: true,
    estimatedCost: 0.05,
    currentBalance: 10,
  })

  mockApiClient.mockImplementation(((_url: string, body: { poolConfig?: { poolType?: string } }) =>
    Promise.resolve({
      serializedTransaction:
        'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
      poolPublicKey: body.poolConfig?.poolType === 'CLMM' ? CLMM_POOL : CPMM_POOL,
      estimatedCosts: {
        poolCreation: 0.02039,
        platformFee: 0.1,
        networkFee: 0.000005,
      },
      message: 'Pool creation transaction prepared successfully',
    })) as unknown as typeof apiClient)

  mockConfirm.mockResolvedValue({
    confirmed: true,
    method: 'kit',
    confirmationTime: 100,
  })
}

// ---------------------------------------------------------------------------
// TOKEN_B_MINT_ADDRESSES
// ---------------------------------------------------------------------------

describe('TOKEN_B_MINT_ADDRESSES', () => {
  it('should export correct mint addresses', () => {
    expect(TOKEN_B_MINT_ADDRESSES).toHaveProperty('SOL')
    expect(TOKEN_B_MINT_ADDRESSES).toHaveProperty('USDC')
    expect(TOKEN_B_MINT_ADDRESSES).toHaveProperty('USDT')
  })

  it('should have the canonical wrapped SOL mint address', () => {
    expect(TOKEN_B_MINT_ADDRESSES.SOL).toBe('So11111111111111111111111111111111111111112')
  })

  it('should have the canonical USDC mint address', () => {
    expect(TOKEN_B_MINT_ADDRESSES.USDC).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  })

  it('should have the canonical USDT mint address', () => {
    expect(TOKEN_B_MINT_ADDRESSES.USDT).toBe('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')
  })

  it('should match mock data constants for cross-test consistency', () => {
    expect(TOKEN_B_MINT_ADDRESSES.SOL).toBe(MOCK_ADDRESSES.tokenB_SOL)
    expect(TOKEN_B_MINT_ADDRESSES.USDC).toBe(MOCK_ADDRESSES.tokenB_USDC)
    expect(TOKEN_B_MINT_ADDRESSES.USDT).toBe(MOCK_ADDRESSES.tokenB_USDT)
  })
})

// ---------------------------------------------------------------------------
// resolveTokenBAddress
// ---------------------------------------------------------------------------

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

  it('should resolve custom to the provided customTokenB address', () => {
    const customMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    expect(resolveTokenBAddress('custom', customMint)).toBe(customMint)
  })

  it('should return null for custom without a customTokenB address', () => {
    expect(resolveTokenBAddress('custom', undefined)).toBeNull()
  })

  it('should return the custom address as-is when provided', () => {
    const addr = MOCK_ADDRESSES.tokenB_USDT
    expect(resolveTokenBAddress('custom', addr)).toBe(addr)
  })
})

// ---------------------------------------------------------------------------
// buildLiquidityRequest
// ---------------------------------------------------------------------------

describe('buildLiquidityRequest', () => {
  const WALLET = MOCK_ADDRESSES.wallet

  it('should build CPMM request correctly using shared mock params', () => {
    const params = mockLiquidityProviderParams
    const tokenBAddress = TOKEN_B_MINT_ADDRESSES.SOL

    const request = buildLiquidityRequest(params, WALLET, tokenBAddress)

    expect(request.walletAddress).toBe(WALLET)
    expect(request.poolConfig.poolType).toBe('CPMM')
    expect(request.poolConfig.tokenA).toBe(params.tokenA)
    expect(request.poolConfig.tokenB).toBe(tokenBAddress)
    expect(request.poolConfig.feeTier).toBe(params.feeTier)
    expect(request.poolConfig.initialLiquidity).toEqual({
      amountA: params.amountA,
      amountB: params.amountB,
    })
  })

  it('should omit priceRange for CPMM pool type', () => {
    const request = buildLiquidityRequest(mockFormData.cpmm, WALLET, TOKEN_B_MINT_ADDRESSES.SOL)
    expect(request.poolConfig).not.toHaveProperty('priceRange')
  })

  it('should build CLMM request with priceRange', () => {
    const params = mockLiquidityProviderParamsCLMM
    const tokenBAddress = TOKEN_B_MINT_ADDRESSES.USDC

    const request = buildLiquidityRequest(params, WALLET, tokenBAddress)

    expect(request.poolConfig.poolType).toBe('CLMM')
    expect(request.poolConfig.priceRange).toEqual({
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
    })
  })

  it('should omit priceRange from CLMM request when minPrice is missing', () => {
    const params = { ...mockLiquidityProviderParamsCLMM, minPrice: undefined }
    const request = buildLiquidityRequest(params, WALLET, TOKEN_B_MINT_ADDRESSES.USDC)
    expect(request.poolConfig.priceRange).toBeUndefined()
  })

  it('should omit priceRange from CLMM request when maxPrice is missing', () => {
    const params = { ...mockLiquidityProviderParamsCLMM, maxPrice: undefined }
    const request = buildLiquidityRequest(params, WALLET, TOKEN_B_MINT_ADDRESSES.USDC)
    expect(request.poolConfig.priceRange).toBeUndefined()
  })

  it('should use the resolved tokenBAddress, not the raw TokenBOption', () => {
    const customMint = MOCK_ADDRESSES.tokenB_USDT
    const params = { ...mockFormData.customToken }
    const request = buildLiquidityRequest(params, WALLET, customMint)
    expect(request.poolConfig.tokenB).toBe(customMint)
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — initial state
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — initial state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
  })

  it('should expose expected fields on mount', () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    expect(result.current).toHaveProperty('provideLiquidity')
    expect(result.current).toHaveProperty('isExecuting')
    expect(result.current).toHaveProperty('lastResult')
    expect(result.current).toHaveProperty('reset')
    expect(result.current).toHaveProperty('isWalletReady')
    expect(result.current).toHaveProperty('validationErrors')
  })

  it('should start with isExecuting = false', () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })
    expect(result.current.isExecuting).toBe(false)
  })

  it('should start with lastResult = null', () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })
    expect(result.current.lastResult).toBeNull()
  })

  it('should report isWalletReady = true when wallet is connected', () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })
    expect(result.current.isWalletReady).toBe(true)
  })

  it('should expose provideLiquidity as a function', () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })
    expect(typeof result.current.provideLiquidity).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — successful CPMM pool creation
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — successful CPMM pool creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
  })

  it('should return a result with poolAddress, signature, and poolType', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(returnValue).not.toBeNull()
    const rv = returnValue as { poolAddress: string; signature: string; poolType: string }
    expect(rv.poolAddress).toBe(CPMM_POOL)
    expect(rv.signature).toBe('MockSignature111111111111111111111111111111')
    expect(rv.poolType).toBe('CPMM')
  })

  it('should set lastResult after successful execution', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(result.current.lastResult).not.toBeNull()
    expect(result.current.lastResult?.poolType).toBe('CPMM')
  })

  it('should set isExecuting = false after completion', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(result.current.isExecuting).toBe(false)
  })

  it('should call showTransactionToast after successful CPMM execution', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(vi.mocked(showTransactionToast)).toHaveBeenCalledWith(
      'MockSignature111111111111111111111111111111',
      expect.stringContaining('CPMM')
    )
  })

  it('should call apiClient with correct wallet address', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(vi.mocked(apiClient)).toHaveBeenCalledWith(
      '/api/solana/liquidity-provider',
      expect.objectContaining({ walletAddress: VALID_WALLET })
    )
  })

  it('should include tokenPair in the result', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(result.current.lastResult?.tokenPair).toEqual(expect.any(String))
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — successful CLMM pool creation
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — successful CLMM pool creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
  })

  it('should return a result with poolType CLMM', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity(mockLiquidityProviderParamsCLMM)
    })

    expect(returnValue).not.toBeNull()
    const rv = returnValue as { poolType: string }
    expect(rv.poolType).toBe('CLMM')
  })

  it('should call apiClient with priceRange in the pool config', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParamsCLMM)
    })

    expect(vi.mocked(apiClient)).toHaveBeenCalledWith(
      '/api/solana/liquidity-provider',
      expect.objectContaining({
        poolConfig: expect.objectContaining({
          poolType: 'CLMM',
          priceRange: {
            minPrice: mockLiquidityProviderParamsCLMM.minPrice,
            maxPrice: mockLiquidityProviderParamsCLMM.maxPrice,
          },
        }),
      })
    )
  })

  it('should open the position with the initial price and the slippage tolerance after the pool confirms', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity({ ...mockLiquidityProviderParamsCLMM, slippageTolerance: '1.5' })
    })

    expect(vi.mocked(apiClient)).toHaveBeenNthCalledWith(
      1,
      '/api/solana/liquidity-provider',
      expect.objectContaining({ poolConfig: expect.objectContaining({ initialPrice: mockLiquidityProviderParamsCLMM.initialPrice }) })
    )
    expect(vi.mocked(apiClient)).toHaveBeenNthCalledWith(
      2,
      '/api/solana/liquidity-provider/open-position',
      expect.objectContaining({
        poolId: CLMM_POOL,
        slippageTolerance: 1.5,
        poolConfig: expect.objectContaining({ poolType: 'CLMM', initialPrice: mockLiquidityProviderParamsCLMM.initialPrice }),
      })
    )
  })

  it('should call showTransactionToast after successful CLMM execution', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParamsCLMM)
    })

    expect(vi.mocked(showTransactionToast)).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('CLMM'))
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — pool confirmed, position step refused
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — CLMM pool confirmed but position refused', () => {
  const POOL_RESPONSE = {
    serializedTransaction: 'AQ==',
    poolPublicKey: CLMM_POOL,
    estimatedCosts: { poolCreation: 0.02, platformFee: 0.1, networkFee: 0.000005 },
    message: 'Pool creation transaction prepared successfully',
  }
  const POSITION_RESPONSE = { serializedTransaction: 'AQ==', positionNftMint: 'PositionNftMint1111111111111111111111111111' }
  const POOL_SIGNATURE = 'MockSignature111111111111111111111111111111'

  async function createPoolWithRefusedPosition() {
    vi.mocked(apiClient)
      .mockResolvedValueOnce(POOL_RESPONSE)
      .mockRejectedValueOnce(new Error('SLIPPAGE_EXCEEDED: price moved beyond the slippage tolerance'))

    const rendered = renderHook(() => useLiquidityProvider(), { wrapper })
    let returnValue: unknown
    await act(async () => {
      returnValue = await rendered.result.current.provideLiquidity(mockLiquidityProviderParamsCLMM)
    })
    return { ...rendered, returnValue }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
  })

  it('should keep the confirmed pool address and signature when the open-position step is refused', async () => {
    const { result, returnValue } = await createPoolWithRefusedPosition()

    // The failure is still reported (no success result, no success toast) ...
    expect(returnValue).toBeNull()
    expect(vi.mocked(showTransactionToast)).not.toHaveBeenCalled()
    // ... but the pool the user already paid for is not lost
    expect(result.current.pendingPosition).toMatchObject({
      poolAddress: CLMM_POOL,
      poolSignature: POOL_SIGNATURE,
      params: mockLiquidityProviderParamsCLMM,
      lastAttemptUnconfirmed: false,
    })
    expect(result.current.lastResult).toBeNull()
  })

  it('should call only the open-position endpoint when opening a position in the existing pool', async () => {
    const { result } = await createPoolWithRefusedPosition()
    vi.mocked(apiClient).mockClear()
    vi.mocked(apiClient).mockResolvedValueOnce(POSITION_RESPONSE)

    let retryResult: unknown
    await act(async () => {
      retryResult = await result.current.openPositionInExistingPool('2')
    })

    expect(vi.mocked(apiClient)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(apiClient)).toHaveBeenCalledWith(
      '/api/solana/liquidity-provider/open-position',
      expect.objectContaining({
        poolId: CLMM_POOL,
        slippageTolerance: 2,
        poolConfig: expect.objectContaining({ poolType: 'CLMM', initialPrice: mockLiquidityProviderParamsCLMM.initialPrice }),
      })
    )
    expect(retryResult).toMatchObject({
      poolAddress: CLMM_POOL,
      signature: POOL_SIGNATURE,
      positionNftMint: POSITION_RESPONSE.positionNftMint,
      poolType: 'CLMM',
    })
    expect(result.current.pendingPosition).toBeNull()
    expect(result.current.lastResult).toMatchObject({ positionNftMint: POSITION_RESPONSE.positionNftMint })
    expect(vi.mocked(showTransactionToast)).toHaveBeenCalledTimes(1)
  })

  it('should re-check the slippage tolerance and keep the pool when it is out of range', async () => {
    const { result } = await createPoolWithRefusedPosition()
    vi.mocked(apiClient).mockClear()

    let retryResult: unknown
    await act(async () => {
      retryResult = await result.current.openPositionInExistingPool('80')
    })

    expect(retryResult).toBeNull()
    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
    expect(result.current.pendingPosition?.poolAddress).toBe(CLMM_POOL)
  })

  it('should keep the pool when the retry is refused again', async () => {
    const { result } = await createPoolWithRefusedPosition()
    vi.mocked(apiClient).mockClear()
    vi.mocked(apiClient).mockRejectedValueOnce(new Error('SLIPPAGE_EXCEEDED'))

    let retryResult: unknown
    await act(async () => {
      retryResult = await result.current.openPositionInExistingPool()
    })

    expect(retryResult).toBeNull()
    expect(result.current.pendingPosition?.poolAddress).toBe(CLMM_POOL)
  })

  it('should flag a position whose confirmation timed out as possibly landed, and keep the flag after a refused retry', async () => {
    // Pool confirms; the position transaction is sent but never confirmed (outcome unknown)
    vi.mocked(confirmTransactionWithParallelStrategy)
      .mockResolvedValueOnce({ confirmed: true, method: 'kit', confirmationTime: 0 })
      .mockResolvedValueOnce({ confirmed: false, method: 'kit', confirmationTime: 0 })
    vi.mocked(useConnection).mockReturnValue({
      connection: {
        sendRawTransaction: vi.fn().mockResolvedValue(POOL_SIGNATURE),
        getLatestBlockhash: vi
          .fn()
          .mockResolvedValue({ blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N', lastValidBlockHeight: 100 }),
        getSignatureStatus: vi.fn().mockResolvedValue(null),
        getBalance: vi.fn().mockResolvedValue(10_000_000_000),
      } as unknown as import('@solana/web3.js').Connection,
    })
    vi.mocked(apiClient).mockResolvedValueOnce(POOL_RESPONSE).mockResolvedValueOnce(POSITION_RESPONSE)
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParamsCLMM)
    })

    expect(result.current.pendingPosition).toMatchObject({ poolAddress: CLMM_POOL, lastAttemptUnconfirmed: true })

    // A refused retry says nothing about the first attempt, which may still land
    vi.mocked(apiClient).mockRejectedValueOnce(new Error('SLIPPAGE_EXCEEDED'))
    await act(async () => {
      await result.current.openPositionInExistingPool()
    })

    expect(result.current.pendingPosition).toMatchObject({ poolAddress: CLMM_POOL, lastAttemptUnconfirmed: true })
  })

  it('should flag the position as possibly landed when its status cannot be read after sending', async () => {
    vi.mocked(confirmTransactionWithParallelStrategy)
      .mockResolvedValueOnce({ confirmed: true, method: 'kit', confirmationTime: 0 })
      .mockResolvedValueOnce({ confirmed: false, method: 'kit', confirmationTime: 0 })
    vi.mocked(useConnection).mockReturnValue({
      connection: {
        sendRawTransaction: vi.fn().mockResolvedValue(POOL_SIGNATURE),
        getLatestBlockhash: vi
          .fn()
          .mockResolvedValue({ blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N', lastValidBlockHeight: 100 }),
        getSignatureStatus: vi.fn().mockRejectedValue(new Error('fetch failed')),
        getBalance: vi.fn().mockResolvedValue(10_000_000_000),
      } as unknown as import('@solana/web3.js').Connection,
    })
    vi.mocked(apiClient).mockResolvedValueOnce(POOL_RESPONSE).mockResolvedValueOnce(POSITION_RESPONSE)
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParamsCLMM)
    })

    expect(result.current.pendingPosition).toMatchObject({ lastAttemptUnconfirmed: true })
  })

  it('should refuse to create another pool while one is pending, until it is dismissed', async () => {
    const { result } = await createPoolWithRefusedPosition()
    vi.mocked(apiClient).mockClear()

    let blocked: unknown
    await act(async () => {
      blocked = await result.current.provideLiquidity(mockLiquidityProviderParamsCLMM)
    })

    expect(blocked).toBeNull()
    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
    expect(result.current.pendingPosition?.poolAddress).toBe(CLMM_POOL)

    act(() => {
      result.current.dismissPendingPosition()
    })
    expect(result.current.pendingPosition).toBeNull()
  })

  it('should have no pending position after a fully successful CLMM provision', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(POOL_RESPONSE).mockResolvedValueOnce(POSITION_RESPONSE)
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParamsCLMM)
    })

    expect(result.current.pendingPosition).toBeNull()
    expect(result.current.lastResult?.positionNftMint).toBe(POSITION_RESPONSE.positionNftMint)
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — client-side verification before signing (CTV-01)
// ---------------------------------------------------------------------------

describe('getMaxWrappedSolLamports', () => {
  it('should bound the wrapped SOL by the entered amount of whichever token is wrapped SOL', () => {
    const sol = TOKEN_B_MINT_ADDRESSES.SOL
    expect(getMaxWrappedSolLamports(mockLiquidityProviderParams, sol)).toBe(BigInt(500_000_000))
    expect(getMaxWrappedSolLamports({ ...mockLiquidityProviderParams, tokenA: sol, amountA: '2' }, MOCK_ADDRESSES.tokenB_USDT)).toBe(
      BigInt(2_000_000_000)
    )
  })

  it('should allow no wrapping when neither token is wrapped SOL', () => {
    expect(getMaxWrappedSolLamports(mockLiquidityProviderParamsCLMM, TOKEN_B_MINT_ADDRESSES.USDT)).toBe(BigInt(0))
  })
})

describe('useLiquidityProvider hook — verification before signing', () => {
  const POOL_RESPONSE = {
    serializedTransaction: 'AQ==',
    poolPublicKey: CLMM_POOL,
    estimatedCosts: { poolCreation: 0.02, platformFee: 0.1, networkFee: 0.000005 },
    message: 'Pool creation transaction prepared successfully',
  }
  const POSITION_RESPONSE = { serializedTransaction: 'AQ==', positionNftMint: 'PositionNftMint1111111111111111111111111111' }
  const REJECTION = new AppError('TRANSACTION_VERIFICATION_FAILED', 'The prepared transaction does not match your request')

  let signTransaction: ReturnType<typeof vi.fn>
  let sendRawTransaction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
    signTransaction = vi.fn((tx: unknown) => Promise.resolve(tx))
    sendRawTransaction = vi.fn().mockResolvedValue('MockSignature111111111111111111111111111111')
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: { toString: () => VALID_WALLET, toBase58: () => VALID_WALLET },
      signTransaction,
    } as unknown as import('@solana/wallet-adapter-react').WalletContextState)
    vi.mocked(useConnection).mockReturnValue({
      connection: {
        sendRawTransaction,
        getLatestBlockhash: vi
          .fn()
          .mockResolvedValue({ blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N', lastValidBlockHeight: 100 }),
        getSignatureStatus: vi.fn().mockResolvedValue(null),
        getBalance: vi.fn().mockResolvedValue(10_000_000_000),
      } as unknown as import('@solana/web3.js').Connection,
    })
  })

  const provide = async (params = mockLiquidityProviderParams) => {
    const rendered = renderHook(() => useLiquidityProvider(), { wrapper })
    let returnValue: unknown
    await act(async () => {
      returnValue = await rendered.result.current.provideLiquidity(params)
    })
    return { ...rendered, returnValue }
  }

  it('should verify the pool-creation transaction against the form before the wallet signs', async () => {
    const { returnValue } = await provide()

    expect(returnValue).not.toBeNull()
    expect(verification.verifyBeforeSigning).toHaveBeenCalledTimes(1)
    expect(verification.verifyBeforeSigning).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'liquidity-provider', transactions: [expect.anything()] }),
      {
        wallet: VALID_WALLET,
        feeWallet: verification.feeWallet,
        maxServiceFeeLamports: BigInt(100_000_000),
        operation: {
          kind: 'raydium-create-pool',
          poolType: 'CPMM',
          tokenA: MOCK_ADDRESSES.tokenA_USDC,
          tokenB: TOKEN_B_MINT_ADDRESSES.SOL,
          feeTier: mockLiquidityProviderParams.feeTier,
          amountA: mockLiquidityProviderParams.amountA,
          amountB: mockLiquidityProviderParams.amountB,
          mintInfo: MINT_INFO,
          maxWrappedSolLamports: BigInt(500_000_000),
        },
      }
    )
    expect(verification.verifyBeforeSigning.mock.invocationCallOrder[0]).toBeLessThan(signTransaction.mock.invocationCallOrder[0])
  })

  it('should bound the platform fee by the discounted fee and send the same coupon', async () => {
    useDiscountCouponStore.setState({ appliedCoupon: { code: 'HALF50', discountPercentage: 50 } })

    await provide()

    expect(vi.mocked(apiClient)).toHaveBeenCalledWith('/api/solana/liquidity-provider', expect.objectContaining({ couponCode: 'HALF50' }))
    expect(verification.verifyBeforeSigning.mock.calls[0][1].maxServiceFeeLamports).toBe(BigInt(50_000_000))
  })

  it('should not ask the wallet to sign or send a pool-creation transaction that fails verification', async () => {
    verification.verifyBeforeSigning.mockRejectedValueOnce(REJECTION)

    const { returnValue, result } = await provide()

    expect(returnValue).toBeNull()
    expect(signTransaction).not.toHaveBeenCalled()
    expect(sendRawTransaction).not.toHaveBeenCalled()
    expect(result.current.pendingPosition).toBeNull()
  })

  it('should verify the CLMM position transaction with the announced NFT mint and no platform fee', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(POOL_RESPONSE).mockResolvedValueOnce(POSITION_RESPONSE)

    await provide(mockLiquidityProviderParamsCLMM)

    expect(verification.verifyBeforeSigning).toHaveBeenCalledTimes(2)
    expect(verification.verifyBeforeSigning).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ toolId: 'liquidity-provider' }),
      expect.objectContaining({
        maxServiceFeeLamports: BigInt(0),
        operation: {
          kind: 'raydium-open-position',
          tokenA: MOCK_ADDRESSES.tokenA_USDC,
          tokenB: TOKEN_B_MINT_ADDRESSES.USDT,
          feeTier: mockLiquidityProviderParamsCLMM.feeTier,
          amountA: mockLiquidityProviderParamsCLMM.amountA,
          amountB: mockLiquidityProviderParamsCLMM.amountB,
          mintInfo: MINT_INFO,
          poolId: CLMM_POOL,
          positionNftMint: POSITION_RESPONSE.positionNftMint,
          minPrice: mockLiquidityProviderParamsCLMM.minPrice,
          maxPrice: mockLiquidityProviderParamsCLMM.maxPrice,
          maxWrappedSolLamports: BigInt(0),
        },
      })
    )
    expect(signTransaction).toHaveBeenCalledTimes(2)
  })

  it('should not sign a position transaction that fails verification, and keep the pool for a retry', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(POOL_RESPONSE).mockResolvedValueOnce(POSITION_RESPONSE)
    verification.verifyBeforeSigning.mockResolvedValueOnce({}).mockRejectedValueOnce(REJECTION)

    const { returnValue, result } = await provide(mockLiquidityProviderParamsCLMM)

    expect(returnValue).toBeNull()
    // Only the pool-creation transaction reached the wallet
    expect(signTransaction).toHaveBeenCalledTimes(1)
    expect(sendRawTransaction).toHaveBeenCalledTimes(1)
    expect(result.current.pendingPosition).toMatchObject({ poolAddress: CLMM_POOL, lastAttemptUnconfirmed: false })
  })

  it('should verify the retried position transaction too, and not sign it when it fails verification', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(POOL_RESPONSE).mockRejectedValueOnce(new Error('SLIPPAGE_EXCEEDED'))
    const { result } = await provide(mockLiquidityProviderParamsCLMM)
    signTransaction.mockClear()
    verification.verifyBeforeSigning.mockClear()

    vi.mocked(apiClient).mockResolvedValueOnce(POSITION_RESPONSE)
    verification.verifyBeforeSigning.mockRejectedValueOnce(REJECTION)
    let rejected: unknown
    await act(async () => {
      rejected = await result.current.openPositionInExistingPool()
    })

    expect(rejected).toBeNull()
    expect(verification.verifyBeforeSigning).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ operation: expect.objectContaining({ kind: 'raydium-open-position', poolId: CLMM_POOL }) })
    )
    expect(signTransaction).not.toHaveBeenCalled()
    expect(result.current.pendingPosition?.poolAddress).toBe(CLMM_POOL)

    vi.mocked(apiClient).mockResolvedValueOnce(POSITION_RESPONSE)
    await act(async () => {
      await result.current.openPositionInExistingPool()
    })
    expect(signTransaction).toHaveBeenCalledTimes(1)
    expect(result.current.pendingPosition).toBeNull()
  })
})

describe('useLiquidityProvider hook — server-announced pool', () => {
  const poolResponse = (poolPublicKey: string) => ({
    serializedTransaction: 'AQ==',
    poolPublicKey,
    estimatedCosts: { poolCreation: 0.02, platformFee: 0.1, networkFee: 0.000005 },
    message: 'Pool creation transaction prepared successfully',
  })
  const POSITION_RESPONSE = { serializedTransaction: 'AQ==', positionNftMint: 'PositionNftMint1111111111111111111111111111' }

  let signTransaction: ReturnType<typeof vi.fn>
  let sendRawTransaction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
    signTransaction = vi.fn((tx: unknown) => Promise.resolve(tx))
    sendRawTransaction = vi.fn().mockResolvedValue('MockSignature111111111111111111111111111111')
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: { toString: () => VALID_WALLET, toBase58: () => VALID_WALLET },
      signTransaction,
    } as unknown as import('@solana/wallet-adapter-react').WalletContextState)
    vi.mocked(useConnection).mockReturnValue({
      connection: {
        sendRawTransaction,
        getLatestBlockhash: vi
          .fn()
          .mockResolvedValue({ blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N', lastValidBlockHeight: 100 }),
        getSignatureStatus: vi.fn().mockResolvedValue(null),
        getBalance: vi.fn().mockResolvedValue(10_000_000_000),
      } as unknown as import('@solana/web3.js').Connection,
    })
  })

  const provide = async (params: typeof mockLiquidityProviderParams) => {
    const rendered = renderHook(() => useLiquidityProvider(), { wrapper })
    let returnValue: unknown
    await act(async () => {
      returnValue = await rendered.result.current.provideLiquidity(params)
    })
    return { ...rendered, returnValue }
  }

  it('should derive different pools for different pool types and fee tiers', () => {
    expect(CPMM_POOL).not.toBe(CLMM_POOL)
    expect(
      deriveRaydiumPoolAddress({
        poolType: 'CLMM',
        feeTier: '1.00',
        tokenA: MOCK_ADDRESSES.tokenA_USDC,
        tokenB: TOKEN_B_MINT_ADDRESSES.USDT,
      })
    ).not.toBe(CLMM_POOL)
  })

  it('should sign nothing when the server announces another CPMM pool id', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(poolResponse(ATTACKER_POOL))

    const { returnValue, result } = await provide(mockLiquidityProviderParams)

    expect(returnValue).toBeNull()
    expect(result.current.lastResult).toBeNull()
    expect(verification.verifyBeforeSigning).not.toHaveBeenCalled()
    expect(signTransaction).not.toHaveBeenCalled()
    expect(sendRawTransaction).not.toHaveBeenCalled()
    expect(showTransactionToast).not.toHaveBeenCalled()
  })

  it('should sign nothing and request no position when the server announces another CLMM pool id', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(poolResponse(ATTACKER_POOL))

    const { returnValue, result } = await provide(mockLiquidityProviderParamsCLMM)

    expect(returnValue).toBeNull()
    expect(vi.mocked(apiClient)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(apiClient)).not.toHaveBeenCalledWith('/api/solana/liquidity-provider/open-position', expect.anything())
    expect(verification.verifyBeforeSigning).not.toHaveBeenCalled()
    expect(signTransaction).not.toHaveBeenCalled()
    expect(sendRawTransaction).not.toHaveBeenCalled()
    expect(result.current.pendingPosition).toBeNull()
  })

  it('should refuse a pool of the other type or fee tier that is otherwise a real pool address', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(poolResponse(CPMM_POOL))

    const { returnValue } = await provide(mockLiquidityProviderParamsCLMM)

    expect(returnValue).toBeNull()
    expect(signTransaction).not.toHaveBeenCalled()
  })

  it('should open the position in the derived pool, and verify the derived pool, not the announced one', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(poolResponse(CLMM_POOL)).mockResolvedValueOnce(POSITION_RESPONSE)

    const { result } = await provide(mockLiquidityProviderParamsCLMM)

    expect(result.current.lastResult?.poolAddress).toBe(CLMM_POOL)
    expect(vi.mocked(apiClient)).toHaveBeenNthCalledWith(
      2,
      '/api/solana/liquidity-provider/open-position',
      expect.objectContaining({ poolId: CLMM_POOL })
    )
    expect(verification.verifyBeforeSigning).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({ operation: expect.objectContaining({ kind: 'raydium-open-position', poolId: CLMM_POOL }) })
    )
  })

  it('should refuse a CPMM fee tier Raydium does not offer before asking the server for a transaction', async () => {
    const { returnValue } = await provide({ ...mockLiquidityProviderParams, feeTier: '0.01' })

    expect(returnValue).toBeNull()
    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
    expect(signTransaction).not.toHaveBeenCalled()
  })

  it('should not ask the server for anything when the mints cannot be read on-chain', async () => {
    verification.fetchRaydiumPoolMints.mockRejectedValueOnce(new AppError('TOKEN_MINT_NOT_FOUND', 'The token mint could not be read'))

    const { returnValue } = await provide(mockLiquidityProviderParams)

    expect(returnValue).toBeNull()
    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — wallet not connected error
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — wallet not connected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
      signAllTransactions: undefined,
      wallet: null,
      wallets: [],
      select: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendTransaction: vi.fn(),
      connecting: false,
      disconnecting: false,
      autoConnect: false,
      signMessage: undefined,
      signIn: undefined,
    } as unknown as import('@solana/wallet-adapter-react').WalletContextState)
  })

  it('should return null when wallet is not connected', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(returnValue).toBeNull()
  })

  it('should report isWalletReady = false when wallet is not connected', () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })
    expect(result.current.isWalletReady).toBe(false)
  })

  it('should not call apiClient when wallet is not connected', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — invalid Token B address error
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — invalid Token B address', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
  })

  it('should return null when custom tokenB is selected but no address is provided', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity({
        ...mockLiquidityProviderParams,
        tokenB: 'custom',
        customTokenB: undefined,
      })
    })

    expect(returnValue).toBeNull()
  })

  it('should not call apiClient when custom token B is missing', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity({
        ...mockLiquidityProviderParams,
        tokenB: 'custom',
        customTokenB: undefined,
      })
    })

    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — missing CLMM price range error
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — missing CLMM price range', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
  })

  it('should return null when CLMM pool is missing minPrice', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity({
        ...mockLiquidityProviderParamsCLMM,
        minPrice: undefined,
      })
    })

    expect(returnValue).toBeNull()
  })

  it('should return null when CLMM pool is missing maxPrice', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity({
        ...mockLiquidityProviderParamsCLMM,
        maxPrice: undefined,
      })
    })

    expect(returnValue).toBeNull()
  })

  it('should not call apiClient when the CLMM initial price is missing', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity({ ...mockLiquidityProviderParamsCLMM, initialPrice: undefined })
    })

    expect(returnValue).toBeNull()
    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
  })

  it('should not create the pool when the slippage tolerance is out of range', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity({ ...mockLiquidityProviderParamsCLMM, slippageTolerance: '75' })
    })

    expect(returnValue).toBeNull()
    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
  })

  it('should not call apiClient when CLMM price range is incomplete', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity({
        ...mockLiquidityProviderParamsCLMM,
        minPrice: undefined,
      })
    })

    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — insufficient balance error
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — insufficient balance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
    vi.mocked(validateBalance).mockResolvedValue({
      hasSufficientBalance: false,
      estimatedCost: 0.05,
      currentBalance: 0.001,
    })
  })

  it('should return null when balance is insufficient', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(returnValue).toBeNull()
  })

  it('should not call apiClient when balance is insufficient', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(vi.mocked(apiClient)).not.toHaveBeenCalled()
  })

  it('should set isExecuting = false after insufficient balance rejection', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(result.current.isExecuting).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — API failure error
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — API failure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
    vi.mocked(apiClient).mockRejectedValue(new Error('API request failed: 500'))
  })

  it('should return null when the API call fails', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(returnValue).toBeNull()
  })

  it('should leave lastResult as null after an API failure', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(result.current.lastResult).toBeNull()
  })

  it('should set isExecuting = false after API failure', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(result.current.isExecuting).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — transaction signing failure
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — transaction signing failure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: {
        toString: () => VALID_WALLET,
        toBase58: () => VALID_WALLET,
      } as unknown as import('@solana/web3.js').PublicKey,
      signTransaction: vi.fn(() => Promise.reject(new Error('User rejected the request'))),
      signAllTransactions: vi.fn(),
      wallet: null,
      wallets: [],
      select: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendTransaction: vi.fn(),
      connecting: false,
      disconnecting: false,
      autoConnect: false,
      signMessage: undefined,
      signIn: undefined,
    } as unknown as import('@solana/wallet-adapter-react').WalletContextState)
  })

  it('should return null when the user rejects signing', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(returnValue).toBeNull()
  })

  it('should set isExecuting = false after signing rejection', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(result.current.isExecuting).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — transaction confirmation timeout
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — transaction confirmation timeout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
    vi.mocked(confirmTransactionWithParallelStrategy).mockResolvedValue({
      confirmed: false,
      method: 'kit',
      confirmationTime: 0,
    })
    // getSignatureStatus returns null (no status = not found)
    vi.mocked(useConnection).mockReturnValue({
      connection: {
        sendRawTransaction: vi.fn().mockResolvedValue('MockSignature111111111111111111111111111111'),
        getLatestBlockhash: vi
          .fn()
          .mockResolvedValue({ blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N', lastValidBlockHeight: 100 }),
        getSignatureStatus: vi.fn().mockResolvedValue(null),
        getBalance: vi.fn().mockResolvedValue(10_000_000_000),
      } as unknown as import('@solana/web3.js').Connection,
    })
  })

  it('should return null when transaction confirmation times out', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(returnValue).toBeNull()
  })

  it('should set isExecuting = false after confirmation timeout', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(result.current.isExecuting).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// useLiquidityProvider hook — reset behavior
// ---------------------------------------------------------------------------

describe('useLiquidityProvider hook — reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetToDefaultMocks()
  })

  it('should clear lastResult after reset', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    expect(result.current.lastResult).not.toBeNull()

    act(() => {
      result.current.reset()
    })

    expect(result.current.lastResult).toBeNull()
  })

  it('should clear validationErrors after reset', async () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
      signAllTransactions: undefined,
      wallet: null,
      wallets: [],
      select: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendTransaction: vi.fn(),
      connecting: false,
      disconnecting: false,
      autoConnect: false,
      signMessage: undefined,
      signIn: undefined,
    } as unknown as import('@solana/wallet-adapter-react').WalletContextState)

    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParams)
    })

    act(() => {
      result.current.reset()
    })

    await waitFor(() => {
      expect(result.current.validationErrors).toHaveLength(0)
    })
  })
})
