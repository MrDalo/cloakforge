import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { getMint } from '@solana/spl-token'

// Mock server-only to prevent server-side directive errors in test environment
vi.mock('server-only', () => ({}))

// Mock getServerConfig
vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    rpcPrivateEndpoint: 'https://api.devnet.solana.com',
    feeWalletAddress: 'So11111111111111111111111111111111111111112',
  })),
}))

// Mock logger
vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Mock createConnectionPair from @/lib/solana barrel
const mockLegacyConnection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'test-blockhash-1234' }),
}
vi.mock('@/lib/solana', () => ({
  createConnectionPair: vi.fn(() => ({
    legacyConnection: mockLegacyConnection,
    kitRpc: {},
  })),
}))

// Mock getMint from @solana/spl-token so we return controlled decimals
vi.mock('@solana/spl-token', () => ({
  getMint: vi.fn().mockResolvedValue({
    decimals: 6,
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  }),
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  TOKEN_2022_PROGRAM_ID: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
}))

// Typed reference to the mocked getMint
const mockGetMint = vi.mocked(getMint)

// Mock global fetch for Raydium API config calls
const mockFetchCpmmConfig = {
  id: 'mock-cpmm-config-id',
  index: 0,
  protocolFeeRate: 120000,
  tradeFeeRate: 2500,
  fundFeeRate: 40000,
  createPoolFee: '100000000',
}

const mockFetchClmmConfig = {
  id: 'mock-clmm-config-id',
  index: 0,
  protocolFeeRate: 12000,
  tradeFeeRate: 500,
  tickSpacing: 10,
  fundFeeRate: 40000,
  description: 'Best for stable pairs',
  defaultRange: 0.1,
  defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5],
}

const makeFetchMock = () =>
  vi.fn(async (url: string) => {
    if (typeof url === 'string' && url.includes('cpmm-config')) {
      return { ok: true, json: async () => ({ data: [mockFetchCpmmConfig] }) }
    }
    if (typeof url === 'string' && url.includes('clmm-config')) {
      return { ok: true, json: async () => ({ data: [mockFetchClmmConfig] }) }
    }
    return { ok: false, status: 404, json: async () => ({}) }
  })

vi.stubGlobal('fetch', makeFetchMock())

// Mock Raydium SDK v2
const mockCpmmCreatePool = vi.fn()
const mockClmmCreatePool = vi.fn()

vi.mock('@raydium-io/raydium-sdk-v2', () => ({
  Raydium: {
    load: vi.fn(async () => ({
      cpmm: {
        createPool: mockCpmmCreatePool,
      },
      clmm: {
        createPool: mockClmmCreatePool,
      },
    })),
  },
  TxVersion: {
    LEGACY: 0,
  },
  API_URLS: {
    BASE_HOST: 'https://api-v3.raydium.io',
    CPMM_CONFIG: '/main/cpmm-config',
    CLMM_CONFIG: '/main/clmm-config',
  },
  CREATE_CPMM_POOL_PROGRAM: { toString: () => 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C' },
  CREATE_CPMM_POOL_FEE_ACC: { toString: () => 'G11111111111111111111111111111111111111111112' },
  DEVNET_PROGRAM_ID: {
    CREATE_CPMM_POOL_PROGRAM: { toString: () => 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C' },
    CREATE_CPMM_POOL_FEE_ACC: { toString: () => 'G11111111111111111111111111111111111111111112' },
    CLMM_PROGRAM_ID: { toString: () => 'devi51mZmdwD7ENovfb7XHAG83HyYjjuqPXm3uBSbvC' },
  },
}))

// Import after mocks are set up
const { createRaydiumPoolTransaction } = await import('../createRaydiumPool')

const MOCK_WALLET = new PublicKey('So11111111111111111111111111111111111111112')
const MOCK_TOKEN_A = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const MOCK_TOKEN_B = 'So11111111111111111111111111111111111111112'

describe('createRaydiumPoolTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockTxData = {
      execute: vi.fn(),
      transaction: {
        serialize: vi.fn(() => Buffer.from('mock-unsigned-transaction')),
        recentBlockhash: 'test-blockhash-1234',
        feePayer: MOCK_WALLET,
      },
      extInfo: {
        address: {
          poolId: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        },
      },
    }

    mockCpmmCreatePool.mockResolvedValue(mockTxData)
    mockClmmCreatePool.mockResolvedValue({
      ...mockTxData,
      extInfo: {
        address: {
          poolId: new PublicKey('So11111111111111111111111111111111111111112'),
        },
      },
    })

    // Restore fetch mock after clearAllMocks resets it
    vi.stubGlobal('fetch', makeFetchMock())

    // Restore getMint mock to default (6 decimals)
    mockGetMint.mockResolvedValue({
      decimals: 6,
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    } as unknown as Awaited<ReturnType<typeof getMint>>)
  })

  it('should create CPMM pool transaction', async () => {
    const params = {
      walletPublicKey: MOCK_WALLET,
      poolConfig: {
        poolType: 'CPMM' as const,
        tokenA: MOCK_TOKEN_A,
        tokenB: MOCK_TOKEN_B,
        feeTier: '0.05' as const,
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    const result = await createRaydiumPoolTransaction(params)

    expect(result).toHaveProperty('serializedTransaction')
    expect(result).toHaveProperty('poolPublicKey')
    expect(result).toHaveProperty('estimatedCosts')
    expect(result.estimatedCosts).toHaveProperty('poolCreation')
    expect(result.estimatedCosts).toHaveProperty('platformFee')
    expect(result.estimatedCosts).toHaveProperty('networkFee')
    expect(typeof result.serializedTransaction).toBe('string')
    expect(result.serializedTransaction.length).toBeGreaterThan(0)
    expect(mockCpmmCreatePool).toHaveBeenCalledOnce()
  })

  it('should create CLMM pool transaction with price range', async () => {
    const params = {
      walletPublicKey: MOCK_WALLET,
      poolConfig: {
        poolType: 'CLMM' as const,
        tokenA: MOCK_TOKEN_A,
        tokenB: MOCK_TOKEN_B,
        feeTier: '0.05' as const,
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
        priceRange: {
          minPrice: '1.5',
          maxPrice: '2.5',
        },
      },
    }

    const result = await createRaydiumPoolTransaction(params)

    expect(result).toHaveProperty('serializedTransaction')
    expect(result).toHaveProperty('poolPublicKey')
    expect(result).toHaveProperty('estimatedCosts')
    expect(typeof result.serializedTransaction).toBe('string')
    expect(result.serializedTransaction.length).toBeGreaterThan(0)
    expect(mockClmmCreatePool).toHaveBeenCalledOnce()
  })

  it('should return correct cost estimate for CPMM pool', async () => {
    const params = {
      walletPublicKey: MOCK_WALLET,
      poolConfig: {
        poolType: 'CPMM' as const,
        tokenA: MOCK_TOKEN_A,
        tokenB: MOCK_TOKEN_B,
        feeTier: '0.25' as const,
        initialLiquidity: {
          amountA: '500',
          amountB: '1.0',
        },
      },
    }

    const result = await createRaydiumPoolTransaction(params)

    expect(result.estimatedCosts.poolCreation).toBe(0.19)
    expect(result.estimatedCosts.platformFee).toBe(0.1)
    expect(result.estimatedCosts.networkFee).toBe(0.0005)
  })

  it('should return correct cost estimate for CLMM pool', async () => {
    const params = {
      walletPublicKey: MOCK_WALLET,
      poolConfig: {
        poolType: 'CLMM' as const,
        tokenA: MOCK_TOKEN_A,
        tokenB: MOCK_TOKEN_B,
        feeTier: '0.05' as const,
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
        priceRange: {
          minPrice: '1.5',
          maxPrice: '2.5',
        },
      },
    }

    const result = await createRaydiumPoolTransaction(params)

    expect(result.estimatedCosts.poolCreation).toBe(0.06)
  })

  it('should use actual on-chain token decimals (not hardcoded values)', async () => {
    // Override: Token A has 9 decimals, Token B has 0 decimals
    mockGetMint
      .mockResolvedValueOnce({
        decimals: 9,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      } as unknown as Awaited<ReturnType<typeof getMint>>)
      .mockResolvedValueOnce({
        decimals: 0,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      } as unknown as Awaited<ReturnType<typeof getMint>>)

    const params = {
      walletPublicKey: MOCK_WALLET,
      poolConfig: {
        poolType: 'CPMM' as const,
        tokenA: MOCK_TOKEN_A,
        tokenB: MOCK_TOKEN_B,
        feeTier: '0.05' as const,
        initialLiquidity: {
          amountA: '1',
          amountB: '1',
        },
      },
    }

    await createRaydiumPoolTransaction(params)

    // Verify SDK was called with the actual mint objects (decimals from getMint, not hardcoded)
    const cpmmCall = mockCpmmCreatePool.mock.calls[0][0]
    expect(cpmmCall.mintA.decimals).toBe(9)
    expect(cpmmCall.mintB.decimals).toBe(0)
  })

  it('should reject invalid wallet address via Zod validation', async () => {
    const invalidWallet = new PublicKey('So11111111111111111111111111111111111111112')
    // Corrupt the toString so it returns an invalid address
    const badParams = {
      walletPublicKey: {
        ...invalidWallet,
        toString: () => 'not-a-valid-solana-address!!!',
      } as unknown as PublicKey,
      poolConfig: {
        poolType: 'CPMM' as const,
        tokenA: MOCK_TOKEN_A,
        tokenB: MOCK_TOKEN_B,
        feeTier: '0.05' as const,
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    await expect(createRaydiumPoolTransaction(badParams)).rejects.toThrow()
  })

  it('should throw when Raydium SDK fails', async () => {
    mockCpmmCreatePool.mockRejectedValue(new Error('SDK error: insufficient config'))

    const params = {
      walletPublicKey: MOCK_WALLET,
      poolConfig: {
        poolType: 'CPMM' as const,
        tokenA: MOCK_TOKEN_A,
        tokenB: MOCK_TOKEN_B,
        feeTier: '0.05' as const,
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    await expect(createRaydiumPoolTransaction(params)).rejects.toThrow()
  })

  it('should throw when Raydium API config fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503 }))
    )

    const params = {
      walletPublicKey: MOCK_WALLET,
      poolConfig: {
        poolType: 'CPMM' as const,
        tokenA: MOCK_TOKEN_A,
        tokenB: MOCK_TOKEN_B,
        feeTier: '0.05' as const,
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    await expect(createRaydiumPoolTransaction(params)).rejects.toThrow(/CPMM config/)
  })
})
