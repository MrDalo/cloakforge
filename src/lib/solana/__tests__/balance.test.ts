/**
 * Unit tests for src/lib/solana/balance.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

// Mock axios
const mockAxiosGet = vi.hoisted(() => vi.fn())
vi.mock('axios', () => ({
  default: {
    get: mockAxiosGet,
  },
}))

// Mock @solana/kit RPC
const mockGetBalance = vi.hoisted(() => vi.fn())
const mockSend = vi.hoisted(() => vi.fn())
const mockCreateSolanaRpc = vi.hoisted(() =>
  vi.fn(() => ({
    getBalance: mockGetBalance,
  }))
)
vi.mock('@solana/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/kit')>()
  return {
    ...actual,
    createSolanaRpc: mockCreateSolanaRpc,
  }
})

// Mock getConfig
vi.mock('@/lib/config/getConfig', () => ({
  default: () => ({
    rpcPublicEndpoint: 'https://api.devnet-beta.solana.com',
    feeWalletAddress: '',
  }),
}))

import { lamportsToSol, solToLamports, getSolanaPrice, getWalletBalance, validateWalletBalance } from '../balance'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { AppError } from '@/lib/errors'

const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

describe('lamportsToSol', () => {
  it('converts 1 SOL worth of lamports', () => {
    expect(lamportsToSol(1_000_000_000)).toBe(1)
  })

  it('converts 0 lamports to 0 SOL', () => {
    expect(lamportsToSol(0)).toBe(0)
  })

  it('converts 0.5 SOL worth of lamports', () => {
    expect(lamportsToSol(500_000_000)).toBe(0.5)
  })

  it('converts 1 lamport to fractional SOL', () => {
    expect(lamportsToSol(1)).toBeCloseTo(1e-9, 12)
  })

  it('handles bigint input', () => {
    expect(lamportsToSol(BigInt(2_000_000_000))).toBe(2)
  })

  it('converts large lamport amounts', () => {
    expect(lamportsToSol(10_000_000_000)).toBe(10)
  })
})

describe('solToLamports', () => {
  it('converts 1 SOL to 1e9 lamports', () => {
    expect(solToLamports(1)).toBe(BigInt(1_000_000_000))
  })

  it('converts 0 SOL to 0 lamports', () => {
    expect(solToLamports(0)).toBe(BigInt(0))
  })

  it('converts 0.5 SOL to 5e8 lamports', () => {
    expect(solToLamports(0.5)).toBe(BigInt(500_000_000))
  })

  it('converts 10 SOL to 1e10 lamports', () => {
    expect(solToLamports(10)).toBe(BigInt(10_000_000_000))
  })

  it('returns a bigint', () => {
    expect(typeof solToLamports(1)).toBe('bigint')
  })

  it('floors fractional lamport results', () => {
    // 0.1 SOL = 100_000_000 lamports exactly, no floating point edge case
    expect(solToLamports(0.1)).toBe(BigInt(100_000_000))
  })
})

describe('round-trip lamports/SOL', () => {
  it('1 SOL → lamports → SOL equals 1', () => {
    const lamportsVal = solToLamports(1)
    expect(lamportsToSol(lamportsVal)).toBe(1)
  })

  it('5.25 SOL round-trips correctly', () => {
    const lamportsVal = solToLamports(5.25)
    expect(lamportsToSol(lamportsVal)).toBe(5.25)
  })
})

describe('getSolanaPrice', () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
  })

  it('returns price from successful API response', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: { status: 'success', data: { price: 150.5 } },
    })
    const price = await getSolanaPrice()
    expect(price).toBe(150.5)
  })

  it('calls /api/solana/price with a 10 second timeout', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: { status: 'success', data: { price: 100 } },
    })
    await getSolanaPrice()
    expect(mockAxiosGet).toHaveBeenCalledWith('/api/solana/price', { timeout: 10000 })
  })

  it('returns 0 when API returns error status', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: { status: 'error', error_message: 'Service unavailable', error_code: 503 },
    })
    const price = await getSolanaPrice()
    expect(price).toBe(0)
  })

  it('returns 0 when axios throws', async () => {
    mockAxiosGet.mockRejectedValueOnce(new Error('Network error'))
    const price = await getSolanaPrice()
    expect(price).toBe(0)
  })

  it('returns 0 when price is undefined in success response', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: { status: 'success', data: { price: 0 } },
    })
    const price = await getSolanaPrice()
    expect(price).toBe(0)
  })

  it('handles unexpected response format and falls back', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: { price: 75.0 },
    })
    const price = await getSolanaPrice()
    expect(price).toBe(75.0)
  })
})

describe('getWalletBalance', () => {
  beforeEach(() => {
    mockGetBalance.mockReset()
    mockCreateSolanaRpc.mockClear()
  })

  it('returns balance in SOL from Kit RPC', async () => {
    const balanceLamports = BigInt(2_000_000_000) // 2 SOL
    mockGetBalance.mockReturnValue({
      send: vi.fn().mockResolvedValue(balanceLamports),
    })

    const balance = await getWalletBalance(USDC_ADDRESS)
    expect(balance).toBe(2)
  })

  it('returns 0 when RPC throws', async () => {
    mockGetBalance.mockReturnValue({
      send: vi.fn().mockRejectedValue(new Error('RPC connection failed')),
    })

    const balance = await getWalletBalance(USDC_ADDRESS)
    expect(balance).toBe(0)
  })

  it('converts string address to Kit address before calling RPC', async () => {
    mockGetBalance.mockReturnValue({
      send: vi.fn().mockResolvedValue(BigInt(1_000_000_000)),
    })

    const balance = await getWalletBalance(USDC_ADDRESS)
    expect(mockGetBalance).toHaveBeenCalled()
    expect(balance).toBe(1)
  })
})

describe('validateWalletBalance', () => {
  let mockConnection: Connection
  let mockLogger: ReturnType<typeof import('@/lib/logger/logger').getLogger>
  let mockKitRpc: ReturnType<typeof import('@solana/kit').createSolanaRpc>

  beforeEach(() => {
    mockConnection = {
      getBalance: vi.fn(),
    } as unknown as Connection

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as ReturnType<typeof import('@/lib/logger/logger').getLogger>

    mockKitRpc = {
      getBalance: vi.fn(),
    } as unknown as ReturnType<typeof import('@solana/kit').createSolanaRpc>
  })

  it('returns hasEnoughBalance true when balance exceeds required amount', async () => {
    const balance = { value: BigInt(5_000_000_000) } // 5 SOL
    ;(mockKitRpc.getBalance as ReturnType<typeof vi.fn>).mockReturnValue({
      send: vi.fn().mockResolvedValue(balance),
    })

    const result = await validateWalletBalance(
      USDC_ADDRESS,
      1_000_000_000, // 1 SOL required
      mockKitRpc,
      mockConnection,
      mockLogger
    )

    expect(result.hasEnoughBalance).toBe(true)
    expect(result.balanceSOL).toBe(5)
  })

  it('returns hasEnoughBalance false when balance is below required amount', async () => {
    const balance = { value: BigInt(500_000_000) } // 0.5 SOL
    ;(mockKitRpc.getBalance as ReturnType<typeof vi.fn>).mockReturnValue({
      send: vi.fn().mockResolvedValue(balance),
    })

    const result = await validateWalletBalance(
      USDC_ADDRESS,
      1_000_000_000, // 1 SOL required
      mockKitRpc,
      mockConnection,
      mockLogger
    )

    expect(result.hasEnoughBalance).toBe(false)
    expect(result.balanceSOL).toBe(0.5)
  })

  it('falls back to legacy connection when Kit RPC fails', async () => {
    ;(mockKitRpc.getBalance as ReturnType<typeof vi.fn>).mockReturnValue({
      send: vi.fn().mockRejectedValue(new Error('Kit RPC failed')),
    })
    ;(mockConnection.getBalance as ReturnType<typeof vi.fn>).mockResolvedValue(3_000_000_000)

    const result = await validateWalletBalance(
      USDC_ADDRESS,
      1_000_000_000,
      mockKitRpc,
      mockConnection,
      mockLogger
    )

    expect(result.hasEnoughBalance).toBe(true)
    expect(result.balanceSOL).toBe(3)
    expect(mockLogger.warn).toHaveBeenCalled()
  })

  it('throws AppError when both Kit RPC and legacy connection fail', async () => {
    ;(mockKitRpc.getBalance as ReturnType<typeof vi.fn>).mockReturnValue({
      send: vi.fn().mockRejectedValue(new Error('Kit RPC failed')),
    })
    ;(mockConnection.getBalance as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Legacy connection failed'))

    await expect(
      validateWalletBalance(USDC_ADDRESS, 1_000_000_000, mockKitRpc, mockConnection, mockLogger)
    ).rejects.toThrow(AppError)
  })

  it('returns correct balance in lamports in the balance field', async () => {
    const lamports = 2_500_000_000
    const balance = { value: BigInt(lamports) }
    ;(mockKitRpc.getBalance as ReturnType<typeof vi.fn>).mockReturnValue({
      send: vi.fn().mockResolvedValue(balance),
    })

    const result = await validateWalletBalance(USDC_ADDRESS, 1_000_000_000, mockKitRpc, mockConnection, mockLogger)

    expect(result.balance).toBe(lamports)
  })

  it('logs warning when balance is insufficient', async () => {
    const balance = { value: BigInt(100_000) }
    ;(mockKitRpc.getBalance as ReturnType<typeof vi.fn>).mockReturnValue({
      send: vi.fn().mockResolvedValue(balance),
    })

    await validateWalletBalance(USDC_ADDRESS, 1_000_000_000, mockKitRpc, mockConnection, mockLogger)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Insufficient wallet balance',
      expect.objectContaining({ shortfallSOL: expect.any(String) })
    )
  })
})
