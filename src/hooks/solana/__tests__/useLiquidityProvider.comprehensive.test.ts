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

import { TOKEN_B_MINT_ADDRESSES, resolveTokenBAddress, buildLiquidityRequest, useLiquidityProvider } from '../useLiquidityProvider'
import { mockFormData, MOCK_ADDRESSES, mockLiquidityProviderParams, mockLiquidityProviderParamsCLMM } from '@/__tests__/utils/mockData'
import { validateBalance } from '@/lib/solana/validateBalance'
import { apiClient } from '@/lib/utils/apiClient'
import { confirmTransactionWithParallelStrategy } from '@/lib/solana'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'

// ---------------------------------------------------------------------------
// Wrapper — plain fragment, hook uses useState not TanStack Query
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children)

// ---------------------------------------------------------------------------
// Helper to reset mocks to default happy-path state
// ---------------------------------------------------------------------------

function resetToDefaultMocks() {
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

  mockApiClient.mockResolvedValue({
    serializedTransaction:
      'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
    poolPublicKey: MOCK_ADDRESSES.pool,
    estimatedCosts: {
      poolCreation: 0.02039,
      platformFee: 0.1,
      networkFee: 0.000005,
    },
    message: 'Pool creation transaction prepared successfully',
  })

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

  it('should include platformFee when provided', () => {
    const request = buildLiquidityRequest(mockLiquidityProviderParams, WALLET, TOKEN_B_MINT_ADDRESSES.SOL)
    expect(request.platformFee).toBe(mockLiquidityProviderParams.platformFee)
  })

  it('should omit platformFee when empty string', () => {
    const params = { ...mockLiquidityProviderParams, platformFee: '' }
    const request = buildLiquidityRequest(params, WALLET, TOKEN_B_MINT_ADDRESSES.SOL)
    expect(request.platformFee).toBeUndefined()
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
    expect(rv.poolAddress).toBe(MOCK_ADDRESSES.pool)
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

  it('should call showTransactionToast after successful CLMM execution', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), { wrapper })

    await act(async () => {
      await result.current.provideLiquidity(mockLiquidityProviderParamsCLMM)
    })

    expect(vi.mocked(showTransactionToast)).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('CLMM'))
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
