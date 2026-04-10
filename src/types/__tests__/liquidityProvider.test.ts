import { describe, it, expect } from 'vitest'
import type {
  LiquidityProviderParams,
  LiquidityProviderRequest,
  LiquidityProviderResponse,
  LiquidityProviderResult,
  PoolType,
  FeeTier,
  TokenBOption,
} from '../liquidityProvider'
import {
  MOCK_ADDRESSES,
  mockLiquidityProviderParams,
  mockLiquidityProviderRequest,
  mockLiquidityProviderResponse,
} from '@/__tests__/utils/mockData'

// ---------------------------------------------------------------------------
// PoolType
// ---------------------------------------------------------------------------

describe('PoolType', () => {
  it('should contain CPMM and CLMM as valid pool types', () => {
    const validPoolTypes: PoolType[] = ['CPMM', 'CLMM']

    expect(validPoolTypes).toContain('CPMM')
    expect(validPoolTypes).toContain('CLMM')
  })

  it('should not contain unsupported pool types', () => {
    const validPoolTypes: PoolType[] = ['CPMM', 'CLMM']
    const invalidPoolType = 'INVALID' as unknown as PoolType

    expect(validPoolTypes).not.toContain(invalidPoolType)
    expect(validPoolTypes).not.toContain('AMM')
    expect(validPoolTypes).not.toContain('DLMM')
  })

  it('should distinguish between CPMM and CLMM', () => {
    const cpmmType: PoolType = 'CPMM'
    const clmmType: PoolType = 'CLMM'

    expect(cpmmType).not.toBe(clmmType)
  })
})

// ---------------------------------------------------------------------------
// FeeTier
// ---------------------------------------------------------------------------

describe('FeeTier', () => {
  it('should contain all four valid fee tiers', () => {
    const validFeeTiers: FeeTier[] = ['0.01', '0.05', '0.25', '1.00']

    expect(validFeeTiers).toHaveLength(4)
    expect(validFeeTiers).toContain('0.01')
    expect(validFeeTiers).toContain('0.05')
    expect(validFeeTiers).toContain('0.25')
    expect(validFeeTiers).toContain('1.00')
  })

  it('should not contain unsupported fee tiers', () => {
    const validFeeTiers: FeeTier[] = ['0.01', '0.05', '0.25', '1.00']

    expect(validFeeTiers).not.toContain('0.03')
    expect(validFeeTiers).not.toContain('0.50')
    expect(validFeeTiers).not.toContain('2.00')
    expect(validFeeTiers).not.toContain('')
  })

  it('should have fee tiers as string values', () => {
    const feeTiers: FeeTier[] = ['0.01', '0.05', '0.25', '1.00']

    feeTiers.forEach((tier) => {
      expect(typeof tier).toBe('string')
    })
  })
})

// ---------------------------------------------------------------------------
// TokenBOption
// ---------------------------------------------------------------------------

describe('TokenBOption', () => {
  it('should include SOL, USDC, USDT, and custom', () => {
    const validOptions: TokenBOption[] = ['SOL', 'USDC', 'USDT', 'custom']

    expect(validOptions).toContain('SOL')
    expect(validOptions).toContain('USDC')
    expect(validOptions).toContain('USDT')
    expect(validOptions).toContain('custom')
  })
})

// ---------------------------------------------------------------------------
// LiquidityProviderParams
// ---------------------------------------------------------------------------

describe('LiquidityProviderParams', () => {
  it('should accept a valid CPMM params object from mock data', () => {
    const params: LiquidityProviderParams = mockLiquidityProviderParams

    expect(params.poolType).toBe('CPMM')
    expect(params.tokenA).toBeDefined()
    expect(params.tokenB).toBe('SOL')
    expect(params.amountA).toBeDefined()
    expect(params.amountB).toBeDefined()
    expect(params.feeTier).toBeDefined()
    expect(params.slippageTolerance).toBeDefined()
    expect(params.deadline).toBeDefined()
    expect(params.platformFee).toBeDefined()
  })

  it('should accept valid CLMM params with optional price range fields', () => {
    const params: LiquidityProviderParams = {
      poolType: 'CLMM',
      tokenA: MOCK_ADDRESSES.tokenA_USDC,
      tokenB: 'USDC',
      amountA: '1000',
      amountB: '500',
      feeTier: '0.01',
      slippageTolerance: '0.5',
      minPrice: '0.01',
      maxPrice: '10.00',
      deadline: '20',
      platformFee: '0.1',
    }

    expect(params.poolType).toBe('CLMM')
    expect(params.minPrice).toBe('0.01')
    expect(params.maxPrice).toBe('10.00')
  })

  it('should allow minPrice and maxPrice to be undefined for CPMM', () => {
    const params: LiquidityProviderParams = mockLiquidityProviderParams

    expect(params.minPrice).toBeUndefined()
    expect(params.maxPrice).toBeUndefined()
  })

  it('should allow customTokenB to be set when tokenB is custom', () => {
    const params: LiquidityProviderParams = {
      poolType: 'CPMM',
      tokenA: MOCK_ADDRESSES.tokenA_USDC,
      tokenB: 'custom',
      customTokenB: MOCK_ADDRESSES.tokenB_USDT,
      amountA: '1000',
      amountB: '500',
      feeTier: '0.25',
      slippageTolerance: '0.5',
      deadline: '20',
      platformFee: '0.1',
    }

    expect(params.tokenB).toBe('custom')
    expect(params.customTokenB).toBe(MOCK_ADDRESSES.tokenB_USDT)
  })
})

// ---------------------------------------------------------------------------
// LiquidityProviderRequest
// ---------------------------------------------------------------------------

describe('LiquidityProviderRequest', () => {
  it('should accept a valid CPMM API request from mock data', () => {
    const request: LiquidityProviderRequest = mockLiquidityProviderRequest

    expect(request.walletAddress).toBe(MOCK_ADDRESSES.wallet)
    expect(request.poolConfig.poolType).toBe('CPMM')
    expect(request.poolConfig.tokenA).toBeDefined()
    expect(request.poolConfig.tokenB).toBeDefined()
    expect(request.poolConfig.feeTier).toBeDefined()
    expect(request.poolConfig.initialLiquidity.amountA).toBeDefined()
    expect(request.poolConfig.initialLiquidity.amountB).toBeDefined()
  })

  it('should accept a valid CLMM API request with priceRange', () => {
    const request: LiquidityProviderRequest = {
      walletAddress: MOCK_ADDRESSES.wallet,
      poolConfig: {
        poolType: 'CLMM',
        tokenA: MOCK_ADDRESSES.tokenA_USDC,
        tokenB: MOCK_ADDRESSES.tokenB_USDC,
        feeTier: '0.01',
        initialLiquidity: {
          amountA: '1000',
          amountB: '500',
        },
        priceRange: {
          minPrice: '0.01',
          maxPrice: '10.00',
        },
      },
    }

    expect(request.poolConfig.priceRange).toBeDefined()
    expect(request.poolConfig.priceRange?.minPrice).toBe('0.01')
    expect(request.poolConfig.priceRange?.maxPrice).toBe('10.00')
  })

  it('should allow priceRange to be undefined for CPMM', () => {
    const request: LiquidityProviderRequest = mockLiquidityProviderRequest

    expect(request.poolConfig.priceRange).toBeUndefined()
  })

  it('should allow optional platformFee', () => {
    const requestWithFee: LiquidityProviderRequest = {
      ...mockLiquidityProviderRequest,
      platformFee: '0.1',
    }
    const requestWithoutFee = { ...mockLiquidityProviderRequest }
    delete (requestWithoutFee as { platformFee?: string }).platformFee

    expect(requestWithFee.platformFee).toBe('0.1')
    expect((requestWithoutFee as LiquidityProviderRequest).platformFee).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// LiquidityProviderResponse
// ---------------------------------------------------------------------------

describe('LiquidityProviderResponse', () => {
  it('should accept a valid response object from mock data', () => {
    const response: LiquidityProviderResponse = mockLiquidityProviderResponse

    expect(response.serializedTransaction).toBeDefined()
    expect(response.serializedTransaction.length).toBeGreaterThan(0)
    expect(response.poolPublicKey).toBe(MOCK_ADDRESSES.pool)
    expect(response.message).toBeDefined()
  })

  it('should include estimated costs with all required fields', () => {
    const response: LiquidityProviderResponse = mockLiquidityProviderResponse

    expect(response.estimatedCosts).toBeDefined()
    expect(typeof response.estimatedCosts.poolCreation).toBe('number')
    expect(typeof response.estimatedCosts.platformFee).toBe('number')
    expect(typeof response.estimatedCosts.networkFee).toBe('number')
  })

  it('should have numeric estimated costs', () => {
    const response: LiquidityProviderResponse = mockLiquidityProviderResponse

    expect(response.estimatedCosts.poolCreation).toBeGreaterThan(0)
    expect(response.estimatedCosts.networkFee).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// LiquidityProviderResult
// ---------------------------------------------------------------------------

describe('LiquidityProviderResult', () => {
  it('should accept a valid result object', () => {
    const result: LiquidityProviderResult = {
      poolAddress: MOCK_ADDRESSES.pool,
      signature: 'mockSignature111111111111111111111111111111111111111111111111111111111111111111111111111',
      poolType: 'CPMM',
      tokenPair: 'USDC/SOL',
      message: 'Liquidity added successfully',
    }

    expect(result.poolAddress).toBe(MOCK_ADDRESSES.pool)
    expect(result.signature).toBeDefined()
    expect(result.poolType).toBe('CPMM')
    expect(result.tokenPair).toBe('USDC/SOL')
    expect(result.message).toBeDefined()
  })

  it('should accept CLMM pool type in result', () => {
    const result: LiquidityProviderResult = {
      poolAddress: MOCK_ADDRESSES.pool,
      signature: 'mockSignature111111111111111111111111111111111111111111111111111111111111111111111111111',
      poolType: 'CLMM',
      tokenPair: 'USDC/USDC',
      message: 'Concentrated liquidity pool created',
    }

    expect(result.poolType).toBe('CLMM')
  })
})
