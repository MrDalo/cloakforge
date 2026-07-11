/**
 * Integration tests for createRaydiumPoolTransaction — transaction v0 format,
 * address lookup table handling, SDK config matching, and error wrapping.
 *
 * These tests complement the existing createRaydiumPool.test.ts by focusing on:
 *  - Returning VersionedTransaction (v0) objects from the SDK mock
 *  - Address lookup table resolution via getAddressLookupTable
 *  - CLMM fee-tier matching logic (exact match vs. throwing on no match)
 *  - Empty and malformed API responses
 *  - AppError pass-through vs. generic error wrapping
 *  - CLMM missing priceRange guard
 *  - Correct program IDs and pool addresses in SDK calls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicKey, VersionedTransaction, MessageV0, type AddressLookupTableAccount } from '@solana/web3.js'
import { getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

// server-only is stubbed globally via src/__tests__/setup.ts — no local mock needed

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

// ---------------------------------------------------------------------------
// Solana connection mock — includes getAddressLookupTable for ALT tests
// ---------------------------------------------------------------------------

const mockLookupTableAccount: AddressLookupTableAccount = {
  key: new PublicKey('So11111111111111111111111111111111111111112'),
  isActive: () => true,
  state: {
    deactivationSlot: BigInt('18446744073709551615'),
    lastExtendedSlot: 100,
    lastExtendedSlotStartIndex: 0,
    authority: undefined,
    addresses: [
      new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    ],
  },
}

const mockLegacyConnection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N',
    lastValidBlockHeight: 200_000_000,
  }),
  getAddressLookupTable: vi.fn().mockResolvedValue({ value: mockLookupTableAccount }),
  getBalance: vi.fn().mockResolvedValue(10_000_000_000),
}

vi.mock('@/lib/solana', () => ({
  createConnectionPair: vi.fn(() => ({
    legacyConnection: mockLegacyConnection,
    kitRpc: {},
  })),
}))

// ---------------------------------------------------------------------------
// SPL token mock — 6 decimals by default, standard TOKEN_PROGRAM_ID
// ---------------------------------------------------------------------------

vi.mock('@solana/spl-token', () => ({
  getMint: vi.fn().mockResolvedValue({
    decimals: 6,
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  }),
  TOKEN_PROGRAM_ID: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  TOKEN_2022_PROGRAM_ID: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
}))

const mockGetMint = vi.mocked(getMint)

// ---------------------------------------------------------------------------
// Raydium API config fixtures
// ---------------------------------------------------------------------------

const MOCK_CPMM_CONFIG = {
  id: 'cpmm-config-abc',
  index: 0,
  protocolFeeRate: 120_000,
  tradeFeeRate: 2_500,
  fundFeeRate: 40_000,
  createPoolFee: '100000000',
}

const MOCK_CLMM_CONFIG_500 = {
  id: 'clmm-config-500bps',
  index: 0,
  protocolFeeRate: 12_000,
  tradeFeeRate: 500, // 0.05% expressed in bps
  tickSpacing: 10,
  fundFeeRate: 40_000,
  description: 'Best for most pairs',
  defaultRange: 0.1,
  defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5],
}

const MOCK_CLMM_CONFIG_100 = {
  id: 'clmm-config-100bps',
  index: 0,
  protocolFeeRate: 12_000,
  tradeFeeRate: 100, // 0.01% expressed in bps
  tickSpacing: 1,
  fundFeeRate: 40_000,
  description: 'Best for stable pairs',
  defaultRange: 0.01,
  defaultRangePoint: [0.001, 0.005, 0.01, 0.05, 0.1],
}

const makeFetchMock = (overrides?: { cpmmOk?: boolean; clmmOk?: boolean }) =>
  vi.fn(async (url: string) => {
    if (typeof url !== 'string') return { ok: false, status: 400 }
    if (url.includes('cpmm-config')) {
      if (overrides?.cpmmOk === false) return { ok: false, status: 503 }
      return { ok: true, json: async () => ({ data: [MOCK_CPMM_CONFIG] }) }
    }
    if (url.includes('clmm-config')) {
      if (overrides?.clmmOk === false) return { ok: false, status: 503 }
      return {
        ok: true,
        json: async () => ({ data: [MOCK_CLMM_CONFIG_100, MOCK_CLMM_CONFIG_500] }),
      }
    }
    return { ok: false, status: 404 }
  })

vi.stubGlobal('fetch', makeFetchMock())

// ---------------------------------------------------------------------------
// Raydium SDK v2 mock — returns VersionedTransaction (v0) objects
// ---------------------------------------------------------------------------

/**
 * Builds a minimal v0 VersionedTransaction that can actually be serialized.
 * Uses a real MessageV0 with a known blockhash so serialize() does not throw.
 */
const buildV0Transaction = (feePayer: PublicKey): VersionedTransaction => {
  const message = new MessageV0({
    header: { numRequiredSignatures: 1, numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1 },
    staticAccountKeys: [feePayer, new PublicKey('11111111111111111111111111111111')],
    recentBlockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N',
    compiledInstructions: [],
    addressTableLookups: [],
  })
  return new VersionedTransaction(message)
}

const MOCK_WALLET = new PublicKey('So11111111111111111111111111111111111111112')
const MOCK_TOKEN_A = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const MOCK_TOKEN_B = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

const mockCpmmCreatePool = vi.fn()
const mockClmmCreatePool = vi.fn()

vi.mock('@raydium-io/raydium-sdk-v2', () => ({
  Raydium: {
    load: vi.fn(async () => ({
      cpmm: { createPool: mockCpmmCreatePool },
      clmm: { createPool: mockClmmCreatePool },
    })),
  },
  TxVersion: {
    LEGACY: 0,
    V0: 1,
  },
  API_URLS: {
    BASE_HOST: 'https://api-v3.raydium.io',
    CPMM_CONFIG: '/main/cpmm-config',
    CLMM_CONFIG: '/main/clmm-config',
  },
}))

// Import under test — must come after all vi.mock() calls
const { createRaydiumPoolTransaction } = await import('../createRaydiumPool')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const cpmmParams = (overrides = {}) => ({
  walletPublicKey: MOCK_WALLET,
  poolConfig: {
    poolType: 'CPMM' as const,
    tokenA: MOCK_TOKEN_A,
    tokenB: MOCK_TOKEN_B,
    feeTier: '0.05' as const,
    initialLiquidity: { amountA: '1000', amountB: '0.5' },
    ...overrides,
  },
})

const clmmParams = (overrides = {}) => ({
  walletPublicKey: MOCK_WALLET,
  poolConfig: {
    poolType: 'CLMM' as const,
    tokenA: MOCK_TOKEN_A,
    tokenB: MOCK_TOKEN_B,
    feeTier: '0.05' as const,
    initialLiquidity: { amountA: '1000', amountB: '0.5' },
    priceRange: { minPrice: '1.5', maxPrice: '2.5' },
    ...overrides,
  },
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createRaydiumPoolTransaction — v0 transaction format', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default v0 CPMM response
    mockCpmmCreatePool.mockResolvedValue({
      transaction: buildV0Transaction(MOCK_WALLET),
      extInfo: {
        address: { poolId: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') },
      },
    })

    // Default v0 CLMM response
    mockClmmCreatePool.mockResolvedValue({
      transaction: buildV0Transaction(MOCK_WALLET),
      extInfo: {
        address: { poolId: new PublicKey('So11111111111111111111111111111111111111112') },
      },
    })

    vi.stubGlobal('fetch', makeFetchMock())

    mockGetMint.mockResolvedValue({
      decimals: 6,
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    } as unknown as Awaited<ReturnType<typeof getMint>>)
  })

  // -------------------------------------------------------------------------
  // v0 transaction serialization
  // -------------------------------------------------------------------------

  it('should serialize a VersionedTransaction returned by the CPMM SDK to base64', async () => {
    const result = await createRaydiumPoolTransaction(cpmmParams())

    expect(typeof result.serializedTransaction).toBe('string')
    expect(result.serializedTransaction.length).toBeGreaterThan(0)
    // Valid base64 string
    expect(() => Buffer.from(result.serializedTransaction, 'base64')).not.toThrow()
  })

  it('should serialize a VersionedTransaction returned by the CLMM SDK to base64', async () => {
    const result = await createRaydiumPoolTransaction(clmmParams())

    expect(typeof result.serializedTransaction).toBe('string')
    expect(result.serializedTransaction.length).toBeGreaterThan(0)
    expect(() => Buffer.from(result.serializedTransaction, 'base64')).not.toThrow()
  })

  it('should produce a different serialized output than an empty buffer', async () => {
    const result = await createRaydiumPoolTransaction(cpmmParams())
    const decoded = Buffer.from(result.serializedTransaction, 'base64')

    // A real v0 transaction header is at minimum 4+ bytes; empty buffer is 0
    expect(decoded.length).toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // Address lookup table — connection interaction
  // -------------------------------------------------------------------------

  it('should establish a connection that supports getAddressLookupTable', async () => {
    // The SDK may call getAddressLookupTable internally during pool creation.
    // We verify the mock connection exposes the method and it can be called.
    const { value } = await mockLegacyConnection.getAddressLookupTable(new PublicKey('So11111111111111111111111111111111111111112'))

    expect(value).not.toBeNull()
    expect(value?.state.addresses.length).toBe(2)
  })

  it('should call Raydium.load with the legacyConnection that has ALT support', async () => {
    const { Raydium } = await import('@raydium-io/raydium-sdk-v2')
    await createRaydiumPoolTransaction(cpmmParams())

    const loadCall = vi.mocked(Raydium.load).mock.calls[0][0]
    // The connection passed to the SDK must expose getAddressLookupTable
    expect(typeof loadCall.connection.getAddressLookupTable).toBe('function')
  })

  it('should resolve ALT with null value (no active table) without throwing', async () => {
    mockLegacyConnection.getAddressLookupTable.mockResolvedValueOnce({ value: null })

    const result = await createRaydiumPoolTransaction(cpmmParams())
    expect(result.serializedTransaction).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // CPMM pool creation — SDK call shape
  // -------------------------------------------------------------------------

  it('should pass CPMM program ID and pool fee account to the SDK', async () => {
    await createRaydiumPoolTransaction(cpmmParams())

    const call = mockCpmmCreatePool.mock.calls[0][0]
    expect(call.programId.toString()).toBe('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C')
    expect(call.poolFeeAccount.toString()).toBe('DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8')
  })

  it('should scale amountA and amountB using actual token decimals', async () => {
    // Token A = 9 decimals, Token B = 6 decimals
    mockGetMint
      .mockResolvedValueOnce({
        decimals: 9,
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      } as unknown as Awaited<ReturnType<typeof getMint>>)
      .mockResolvedValueOnce({
        decimals: 6,
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      } as unknown as Awaited<ReturnType<typeof getMint>>)

    await createRaydiumPoolTransaction(cpmmParams({ initialLiquidity: { amountA: '1', amountB: '1' } }))

    const call = mockCpmmCreatePool.mock.calls[0][0]
    // 1 * 10^9 = 1_000_000_000
    expect(call.mintAAmount.toString()).toBe('1000000000')
    // 1 * 10^6 = 1_000_000
    expect(call.mintBAmount.toString()).toBe('1000000')
  })

  it('should pass the CPMM fee config returned by the Raydium API to the SDK', async () => {
    await createRaydiumPoolTransaction(cpmmParams())

    const call = mockCpmmCreatePool.mock.calls[0][0]
    expect(call.feeConfig.id).toBe('cpmm-config-abc')
    expect(call.feeConfig.tradeFeeRate).toBe(2_500)
  })

  it('should return poolPublicKey from CPMM extInfo.address.poolId', async () => {
    const result = await createRaydiumPoolTransaction(cpmmParams())
    expect(result.poolPublicKey).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  })

  it('should fall back to "pending" when extInfo.address.poolId is absent for CPMM', async () => {
    mockCpmmCreatePool.mockResolvedValueOnce({
      transaction: buildV0Transaction(MOCK_WALLET),
      extInfo: {},
    })

    const result = await createRaydiumPoolTransaction(cpmmParams())
    expect(result.poolPublicKey).toBe('pending')
  })

  // -------------------------------------------------------------------------
  // CLMM pool creation — fee tier matching
  // -------------------------------------------------------------------------

  it('should select CLMM config matching the requested fee tier in bps', async () => {
    // feeTier "0.05" → 500 bps → should match MOCK_CLMM_CONFIG_500
    await createRaydiumPoolTransaction(clmmParams({ feeTier: '0.05' as const }))

    const call = mockClmmCreatePool.mock.calls[0][0]
    expect(call.ammConfig.tradeFeeRate).toBe(500)
    expect(call.ammConfig.id).toBe('clmm-config-500bps')
  })

  it('should select CLMM config matching 0.01% fee tier (100 bps)', async () => {
    await createRaydiumPoolTransaction(clmmParams({ feeTier: '0.01' as const }))

    const call = mockClmmCreatePool.mock.calls[0][0]
    expect(call.ammConfig.tradeFeeRate).toBe(100)
    expect(call.ammConfig.id).toBe('clmm-config-100bps')
  })

  it('should throw (never silently substitute a different fee tier) when no fee tier matches', async () => {
    // Return only MOCK_CLMM_CONFIG_500; request feeTier "0.01" (100 bps) — no match
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('clmm-config')) {
          return { ok: true, json: async () => ({ data: [MOCK_CLMM_CONFIG_500] }) }
        }
        return { ok: true, json: async () => ({ data: [MOCK_CPMM_CONFIG] }) }
      })
    )

    await expect(createRaydiumPoolTransaction(clmmParams({ feeTier: '0.01' as const }))).rejects.toThrow(/fee tier/i)
    expect(mockClmmCreatePool).not.toHaveBeenCalled()
  })

  it('should pass initialPrice as a Decimal from priceRange.minPrice to the CLMM SDK', async () => {
    await createRaydiumPoolTransaction(clmmParams({ priceRange: { minPrice: '3.14', maxPrice: '6.28' } }))

    const call = mockClmmCreatePool.mock.calls[0][0]
    expect(call.initialPrice.toString()).toBe('3.14')
  })

  it('should pass CLMM program ID to the SDK', async () => {
    await createRaydiumPoolTransaction(clmmParams())

    const call = mockClmmCreatePool.mock.calls[0][0]
    expect(call.programId.toString()).toBe('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK')
  })

  it('should return poolPublicKey from CLMM extInfo.address.poolId', async () => {
    const result = await createRaydiumPoolTransaction(clmmParams())
    expect(result.poolPublicKey).toBe('So11111111111111111111111111111111111111112')
  })

  it('should include the correct message for CLMM pool creation', async () => {
    const result = await createRaydiumPoolTransaction(clmmParams())
    expect(result.message).toContain('CLMM')
  })

  // -------------------------------------------------------------------------
  // CLMM missing priceRange guard
  // -------------------------------------------------------------------------

  it('should throw AppError INVALID_INPUT when CLMM priceRange.minPrice is absent', async () => {
    const { AppError } = await import('@/lib/errors/AppError')

    await expect(createRaydiumPoolTransaction(clmmParams({ priceRange: undefined }))).rejects.toThrow(AppError)
  })

  it('should include "Price range" in the error message when CLMM priceRange is missing', async () => {
    await expect(createRaydiumPoolTransaction(clmmParams({ priceRange: undefined }))).rejects.toThrow(/Price range/)
  })

  // -------------------------------------------------------------------------
  // SDK error handling — AppError pass-through vs. generic wrapping
  // -------------------------------------------------------------------------

  it('should re-throw AppError instances from CPMM SDK without wrapping', async () => {
    const { AppError } = await import('@/lib/errors/AppError')
    const originalError = new AppError('TRANSACTION_FAILED', 'Pool already exists')
    mockCpmmCreatePool.mockRejectedValueOnce(originalError)

    const thrown = await createRaydiumPoolTransaction(cpmmParams()).catch((e) => e)
    expect(thrown).toBe(originalError)
    expect(thrown.code).toBe('TRANSACTION_FAILED')
    expect(thrown.message).toBe('Pool already exists')
  })

  it('should wrap generic SDK errors in AppError TRANSACTION_FAILED for CPMM', async () => {
    const { AppError } = await import('@/lib/errors/AppError')
    mockCpmmCreatePool.mockRejectedValueOnce(new Error('RPC node unavailable'))

    const thrown = await createRaydiumPoolTransaction(cpmmParams()).catch((e) => e)
    expect(thrown).toBeInstanceOf(AppError)
    expect(thrown.code).toBe('TRANSACTION_FAILED')
    expect(thrown.message).toContain('CPMM')
    expect(thrown.message).toContain('RPC node unavailable')
  })

  it('should wrap generic SDK errors in AppError TRANSACTION_FAILED for CLMM', async () => {
    const { AppError } = await import('@/lib/errors/AppError')
    mockClmmCreatePool.mockRejectedValueOnce(new Error('tick array not initialized'))

    const thrown = await createRaydiumPoolTransaction(clmmParams()).catch((e) => e)
    expect(thrown).toBeInstanceOf(AppError)
    expect(thrown.code).toBe('TRANSACTION_FAILED')
    expect(thrown.message).toContain('CLMM')
  })

  it('should wrap non-Error SDK throws (string) in AppError for CPMM', async () => {
    const { AppError } = await import('@/lib/errors/AppError')
    mockCpmmCreatePool.mockRejectedValueOnce('string error from SDK')

    const thrown = await createRaydiumPoolTransaction(cpmmParams()).catch((e) => e)
    expect(thrown).toBeInstanceOf(AppError)
    expect(thrown.message).toContain('string error from SDK')
  })

  // -------------------------------------------------------------------------
  // API config fetch failures
  // -------------------------------------------------------------------------

  it('should throw AppError when CPMM config API returns non-ok status', async () => {
    const { AppError } = await import('@/lib/errors/AppError')
    vi.stubGlobal('fetch', makeFetchMock({ cpmmOk: false }))

    const thrown = await createRaydiumPoolTransaction(cpmmParams()).catch((e) => e)
    expect(thrown).toBeInstanceOf(AppError)
    expect(thrown.code).toBe('TRANSACTION_FAILED')
    expect(thrown.message).toContain('CPMM config')
    expect(thrown.message).toContain('503')
  })

  it('should throw AppError when CLMM config API returns non-ok status', async () => {
    const { AppError } = await import('@/lib/errors/AppError')
    vi.stubGlobal('fetch', makeFetchMock({ clmmOk: false }))

    const thrown = await createRaydiumPoolTransaction(clmmParams()).catch((e) => e)
    expect(thrown).toBeInstanceOf(AppError)
    expect(thrown.code).toBe('TRANSACTION_FAILED')
    expect(thrown.message).toContain('CLMM config')
  })

  it('should throw AppError when CPMM config API returns empty data array', async () => {
    const { AppError } = await import('@/lib/errors/AppError')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ data: [] }) }))
    )

    const thrown = await createRaydiumPoolTransaction(cpmmParams()).catch((e) => e)
    expect(thrown).toBeInstanceOf(AppError)
    expect(thrown.message).toContain('No CPMM fee configs')
  })

  it('should throw AppError when CLMM config API returns empty data array', async () => {
    const { AppError } = await import('@/lib/errors/AppError')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('cpmm-config')) return { ok: true, json: async () => ({ data: [MOCK_CPMM_CONFIG] }) }
        return { ok: true, json: async () => ({ data: [] }) }
      })
    )

    const thrown = await createRaydiumPoolTransaction(clmmParams()).catch((e) => e)
    expect(thrown).toBeInstanceOf(AppError)
    expect(thrown.message).toContain('No CLMM configs')
  })

  // -------------------------------------------------------------------------
  // Token-2022 program detection
  // -------------------------------------------------------------------------

  it('should use the programId returned by getMint for Token-2022 mints (Token A)', async () => {
    // fetchMintDecimals tries TOKEN_2022_PROGRAM_ID first for each token.
    // When getMint succeeds, it stores the programId from the returned mintInfo object.
    // Both tokens resolve concurrently via Promise.all, so getMint is called twice total
    // (once per token, both using TOKEN_2022_PROGRAM_ID as the program argument).
    mockGetMint
      .mockResolvedValueOnce({
        decimals: 8,
        programId: TOKEN_2022_PROGRAM_ID,
      } as unknown as Awaited<ReturnType<typeof getMint>>) // Token A — Token-2022 mint
      .mockResolvedValueOnce({
        decimals: 6,
        programId: TOKEN_2022_PROGRAM_ID,
      } as unknown as Awaited<ReturnType<typeof getMint>>) // Token B — also Token-2022

    await createRaydiumPoolTransaction(cpmmParams())

    const call = mockCpmmCreatePool.mock.calls[0][0]
    expect(call.mintA.programId).toBe(TOKEN_2022_PROGRAM_ID.toString())
    expect(call.mintA.decimals).toBe(8)
    expect(call.mintB.decimals).toBe(6)
  })

  it('should use TOKEN_PROGRAM_ID when TOKEN_2022 getMint throws and fallback succeeds', async () => {
    // fetchMintDecimals calls getMint(TOKEN_2022_PROGRAM_ID) first; on throw it falls back
    // to getMint(TOKEN_PROGRAM_ID). Both tokens run in Promise.all concurrently.
    // Call order (approximate): Token-A/Token-2022 reject, Token-B/Token-2022 resolve,
    // Token-A/TOKEN_PROGRAM fallback resolves. Total: 3 getMint calls.
    mockGetMint
      .mockRejectedValueOnce(new Error('Invalid program id')) // Token A — Token-2022 fails
      .mockResolvedValueOnce({
        decimals: 6,
        programId: TOKEN_2022_PROGRAM_ID,
      } as unknown as Awaited<ReturnType<typeof getMint>>) // Token B — Token-2022 succeeds
      .mockResolvedValueOnce({
        decimals: 9,
        programId: TOKEN_PROGRAM_ID,
      } as unknown as Awaited<ReturnType<typeof getMint>>) // Token A fallback succeeds

    await createRaydiumPoolTransaction(cpmmParams())

    const call = mockCpmmCreatePool.mock.calls[0][0]
    // Token A fell back to TOKEN_PROGRAM_ID
    expect(call.mintA.programId).toBe(TOKEN_PROGRAM_ID.toString())
    expect(call.mintA.decimals).toBe(9)
  })

  // -------------------------------------------------------------------------
  // Cost estimates
  // -------------------------------------------------------------------------

  it('should return CPMM pool creation cost of 0.19 SOL', async () => {
    const result = await createRaydiumPoolTransaction(cpmmParams())
    expect(result.estimatedCosts.poolCreation).toBe(0.19)
  })

  it('should return CLMM pool creation cost of 0.06 SOL', async () => {
    const result = await createRaydiumPoolTransaction(clmmParams())
    expect(result.estimatedCosts.poolCreation).toBe(0.06)
  })

  it('should return constant platform fee of 0.1 SOL for both pool types', async () => {
    const cpmmResult = await createRaydiumPoolTransaction(cpmmParams())
    expect(cpmmResult.estimatedCosts.platformFee).toBe(0.1)

    mockCpmmCreatePool.mockResolvedValueOnce({
      transaction: buildV0Transaction(MOCK_WALLET),
      extInfo: { address: { poolId: MOCK_WALLET } },
    })

    const clmmResult = await createRaydiumPoolTransaction(clmmParams())
    expect(clmmResult.estimatedCosts.platformFee).toBe(0.1)
  })

  it('should return constant network fee of 0.0005 SOL', async () => {
    const result = await createRaydiumPoolTransaction(cpmmParams())
    expect(result.estimatedCosts.networkFee).toBe(0.0005)
  })

  // -------------------------------------------------------------------------
  // Success message
  // -------------------------------------------------------------------------

  it('should include pool type in the success message for CPMM', async () => {
    const result = await createRaydiumPoolTransaction(cpmmParams())
    expect(result.message).toContain('CPMM')
  })

  it('should include "prepared successfully" in the success message', async () => {
    const result = await createRaydiumPoolTransaction(cpmmParams())
    expect(result.message.toLowerCase()).toContain('prepared successfully')
  })
})
