/**
 * Unit tests for src/lib/solana/validateBalance.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

// Mock spl-token
const mockGetMinimumBalanceForRentExemptMint = vi.hoisted(() => vi.fn())
vi.mock('@solana/spl-token', () => ({
  getMinimumBalanceForRentExemptMint: mockGetMinimumBalanceForRentExemptMint,
}))

// Mock toolFeeConfigs
vi.mock('@/lib/utils/feeConfigs', () => ({
  toolFeeConfigs: {
    'token-creator': () => [
      { fieldName: 'revokeMintAuthority', fee: 0.05 },
      { fieldName: 'revokeFreezeAuthority', fee: 0.05 },
    ],
    'burn-tokens': () => [{ fieldName: 'burnAll', fee: 0.05 }],
    'freeze-accounts': () => [],
  },
}))

import { validateBalance, type GenericBalanceParams } from '../validateBalance'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { AppError } from '@/lib/errors'

const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const walletPublicKey = new PublicKey(USDC_ADDRESS)

function makeConnection(balanceLamports: number): Connection {
  return {
    getBalance: vi.fn().mockResolvedValue(balanceLamports),
  } as unknown as Connection
}

function makeParams(overrides: Partial<GenericBalanceParams> = {}): GenericBalanceParams {
  return {
    walletPublicKey,
    connection: makeConnection(5 * LAMPORTS_PER_SOL), // 5 SOL default
    serviceId: 'freeze-accounts',
    formData: {},
    serviceFee: 0.1,
    networkFee: 0.001,
    ...overrides,
  }
}

describe('validateBalance', () => {
  beforeEach(() => {
    mockGetMinimumBalanceForRentExemptMint.mockReset()
    mockGetMinimumBalanceForRentExemptMint.mockResolvedValue(2_039_280)
  })

  it('returns hasSufficientBalance true when wallet has enough SOL', async () => {
    const params = makeParams()
    const result = await validateBalance(params)
    expect(result.hasSufficientBalance).toBe(true)
  })

  it('returns hasSufficientBalance false when wallet balance is too low', async () => {
    const params = makeParams({
      connection: makeConnection(0.05 * LAMPORTS_PER_SOL), // 0.05 SOL
      serviceFee: 0.1,
      networkFee: 0.001,
    })
    const result = await validateBalance(params)
    // estimatedCost = 0.1 + 0.001 = 0.101, need 0.101 + 0.001 buffer = 0.102
    // balance 0.05 < 0.102
    expect(result.hasSufficientBalance).toBe(false)
  })

  it('returns the current balance in SOL', async () => {
    const params = makeParams({
      connection: makeConnection(3 * LAMPORTS_PER_SOL),
    })
    const result = await validateBalance(params)
    expect(result.currentBalance).toBe(3)
  })

  it('returns the estimated cost (serviceFee + networkFee)', async () => {
    const params = makeParams({
      serviceFee: 0.2,
      networkFee: 0.005,
    })
    const result = await validateBalance(params)
    expect(result.estimatedCost).toBeCloseTo(0.205, 5)
  })

  it('applies conditional fees from formData for matching fields', async () => {
    const params = makeParams({
      serviceId: 'burn-tokens',
      formData: { burnAll: true },
      serviceFee: 0.05,
      networkFee: 0.001,
      connection: makeConnection(10 * LAMPORTS_PER_SOL),
    })
    const result = await validateBalance(params)
    // 'burn-tokens'.includes('token') === true, so rent exemption is added
    // 0.05 (base) + 0.05 (burnAll conditional) + 0.001 (networkFee) + 0.00203928 (rent) ≈ 0.10303928
    expect(result.estimatedCost).toBeCloseTo(0.05 + 0.05 + 0.001 + 2_039_280 / LAMPORTS_PER_SOL, 5)
  })

  it('does not apply conditional fees for false fields', async () => {
    const params = makeParams({
      serviceId: 'burn-tokens',
      formData: { burnAll: false },
      serviceFee: 0.05,
      networkFee: 0.001,
      connection: makeConnection(10 * LAMPORTS_PER_SOL),
    })
    const result = await validateBalance(params)
    // 'burn-tokens'.includes('token') === true, so rent exemption is added
    // 0.05 (base) + 0.001 (networkFee) + 0.00203928 (rent) ≈ 0.05303928
    expect(result.estimatedCost).toBeCloseTo(0.05 + 0.001 + 2_039_280 / LAMPORTS_PER_SOL, 5)
  })

  it('applies conditional fees for string "true" fields', async () => {
    const params = makeParams({
      serviceId: 'token-creator',
      formData: { revokeMintAuthority: 'true' },
      serviceFee: 0.1,
      networkFee: 0.001,
      connection: makeConnection(10 * LAMPORTS_PER_SOL),
    })

    // For token-creator, rent exemption is also added — mock it
    mockGetMinimumBalanceForRentExemptMint.mockResolvedValue(2_039_280)

    const result = await validateBalance(params)
    // serviceFee 0.1 + revokeMintAuthority 0.05 + networkFee 0.001 + rent ~0.00203928
    expect(result.estimatedCost).toBeGreaterThan(0.15)
  })

  it('adds rent exemption cost for token-creator serviceId', async () => {
    mockGetMinimumBalanceForRentExemptMint.mockResolvedValue(2_039_280) // ~0.00203928 SOL

    const params = makeParams({
      serviceId: 'token-creator',
      formData: {},
      serviceFee: 0.1,
      networkFee: 0.001,
      connection: makeConnection(10 * LAMPORTS_PER_SOL),
    })

    const result = await validateBalance(params)
    // networkFee should be 0.001 + 0.00203928 ≈ 0.00303928
    // estimatedCost = 0.1 + 0.00303928 ≈ 0.10303928
    expect(result.estimatedCost).toBeCloseTo(0.1 + 0.001 + 2_039_280 / LAMPORTS_PER_SOL, 5)
  })

  it('uses fallback rent exemption when getMinimumBalanceForRentExemptMint throws', async () => {
    mockGetMinimumBalanceForRentExemptMint.mockRejectedValue(new Error('RPC failed'))

    const params = makeParams({
      serviceId: 'token-creator',
      formData: {},
      serviceFee: 0.1,
      networkFee: 0.001,
      connection: makeConnection(10 * LAMPORTS_PER_SOL),
    })

    const result = await validateBalance(params)
    // Fallback is 0.00203928, so estimatedCost = 0.1 + 0.001 + 0.00203928
    expect(result.estimatedCost).toBeCloseTo(0.1 + 0.001 + 0.00203928, 5)
  })

  it('throws AppError when getBalance fails', async () => {
    const params = makeParams({
      connection: {
        getBalance: vi.fn().mockRejectedValue(new Error('Connection failed')),
      } as unknown as Connection,
    })

    await expect(validateBalance(params)).rejects.toThrow(AppError)
  })

  it('thrown AppError has INSUFFICIENT_FUNDS code when balance check fails', async () => {
    const params = makeParams({
      connection: {
        getBalance: vi.fn().mockRejectedValue(new Error('Connection failed')),
      } as unknown as Connection,
    })

    try {
      await validateBalance(params)
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).code).toBe('INSUFFICIENT_FUNDS')
    }
  })

  it('includes 0.001 buffer in the hasSufficientBalance check', async () => {
    // estimatedCost = 0.1 + 0.001 = 0.101
    // balance exactly = 0.101 should fail because buffer = 0.001 (need 0.102)
    const params = makeParams({
      connection: makeConnection(0.101 * LAMPORTS_PER_SOL),
      serviceFee: 0.1,
      networkFee: 0.001,
    })

    const result = await validateBalance(params)
    expect(result.hasSufficientBalance).toBe(false)
  })

  it('passes when balance equals estimatedCost plus buffer', async () => {
    // estimatedCost = 0.1 + 0.001 = 0.101, buffer = 0.001, need 0.102
    const params = makeParams({
      connection: makeConnection(0.103 * LAMPORTS_PER_SOL),
      serviceFee: 0.1,
      networkFee: 0.001,
    })

    const result = await validateBalance(params)
    expect(result.hasSufficientBalance).toBe(true)
  })

  it('handles serviceId without matching toolFeeConfig gracefully', async () => {
    const params = makeParams({
      serviceId: 'unknown-service',
      formData: { someBoolField: true },
      serviceFee: 0.05,
      networkFee: 0.001,
      connection: makeConnection(5 * LAMPORTS_PER_SOL),
    })

    // Should not throw
    const result = await validateBalance(params)
    expect(result).toHaveProperty('hasSufficientBalance')
  })
})
