/**
 * Solana Transaction Utilities Tests
 *
 * Covers all 5 exported functions:
 * - createTransaction
 * - addComputeBudgetInstructions
 * - getFreshBlockhash
 * - calculateDynamicPriorityFee
 * - confirmTransactionWithParallelStrategy
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock @solana/kit
// vi.mock factories are hoisted to the top of the file by Vitest, so all
// referenced values must be defined inline (no top-level variables).
// ---------------------------------------------------------------------------

vi.mock('@solana/kit', () => {
  const mockSendFn = vi.fn()
  const rpcInstance = {
    getLatestBlockhash: vi.fn(() => ({ send: mockSendFn })),
    getRecentPrioritizationFees: vi.fn(() => ({ send: mockSendFn })),
    getSignatureStatuses: vi.fn(() => ({ send: mockSendFn })),
    _mockSend: mockSendFn, // expose for retrieval
  }
  return {
    createSolanaRpc: vi.fn(() => rpcInstance),
    lamports: vi.fn((n: bigint) => n),
    signature: vi.fn((s: string) => s),
  }
})

// ---------------------------------------------------------------------------
// Mock @solana/web3.js
// ---------------------------------------------------------------------------

vi.mock('@solana/web3.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/web3.js')>()

  class MockPublicKey {
    private _key: string
    constructor(key: string | { _key: string }) {
      this._key = typeof key === 'string' ? key : key._key
    }
    toString() {
      return this._key
    }
    toBase58() {
      return this._key
    }
  }

  // Check instanceof by duck-typing in the source under test
  // The source does `publicKey instanceof PublicKey`, so we need MockPublicKey
  // to behave correctly for that check. Since we replace PublicKey entirely,
  // instances created via `new PublicKey(...)` in the module under test will
  // be MockPublicKey instances.

  return {
    ...actual,
    PublicKey: MockPublicKey,
    Transaction: class MockTransaction {
      add = vi.fn()
    },
    TransactionMessage: class MockTransactionMessage {
      constructor() {}
      compileToLegacyMessage = vi.fn(() => 'compiled-legacy-message')
    },
    VersionedTransaction: vi.fn(),
    SystemProgram: {
      transfer: vi.fn(() => 'transferInstruction'),
    },
    ComputeBudgetProgram: {
      setComputeUnitLimit: vi.fn(() => 'computeUnitLimitInstruction'),
      setComputeUnitPrice: vi.fn(() => 'computeUnitPriceInstruction'),
    },
    LAMPORTS_PER_SOL: 1_000_000_000,
  }
})

// ---------------------------------------------------------------------------
// Import mocked modules and the module under test
// ---------------------------------------------------------------------------

import { createSolanaRpc } from '@solana/kit'
import { PublicKey, Transaction, SystemProgram, ComputeBudgetProgram, VersionedTransaction } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'
import {
  createTransaction,
  addComputeBudgetInstructions,
  getFreshBlockhash,
  calculateDynamicPriorityFee,
  confirmTransactionWithParallelStrategy,
} from '../transactions'

// ---------------------------------------------------------------------------
// Shared test data and helpers
// ---------------------------------------------------------------------------

const MOCK_PUBKEY_STRING = 'So11111111111111111111111111111111111111112'
const MOCK_DEST_STRING = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const MOCK_BLOCKHASH = 'MockBlockhash1111111111111111111111111111111'
const MOCK_BLOCK_HEIGHT = 12345

// Create a stable mockKitRpc reference via the mocked factory
const mockKitRpc = createSolanaRpc('https://api.mainnet-beta.solana.com')

// Retrieve the shared mockSend function from the rpc instance
// The mock factory attaches it as _mockSend for test access

const mockSend = (mockKitRpc as unknown as Record<string, unknown>)._mockSend as ReturnType<typeof vi.fn>

const mockGetLatestBlockhashLegacy = vi.fn()
const mockGetSignatureStatus = vi.fn()

const mockLegacyConnection = {
  getLatestBlockhash: mockGetLatestBlockhashLegacy,
  getSignatureStatus: mockGetSignatureStatus,
}

// The setup.ts already mocks logger globally; use a logger with spyable methods
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}

// Unused import kept for reference — suppress lint
void getLogger

// ---------------------------------------------------------------------------
// createTransaction
// ---------------------------------------------------------------------------

describe('createTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLatestBlockhashLegacy.mockResolvedValue({
      blockhash: MOCK_BLOCKHASH,
      lastValidBlockHeight: MOCK_BLOCK_HEIGHT,
    })
  })

  it('should call getLatestBlockhash on the connection', async () => {
    const publicKey = new PublicKey(MOCK_PUBKEY_STRING)
    const destination = new PublicKey(MOCK_DEST_STRING)

    await createTransaction({
      publicKey,
      destination,
      amount: 1,
      connection: mockLegacyConnection as unknown as import('@solana/web3.js').Connection,
    })

    expect(mockGetLatestBlockhashLegacy).toHaveBeenCalledOnce()
  })

  it('should return transaction and latestBlockhash', async () => {
    const publicKey = new PublicKey(MOCK_PUBKEY_STRING)
    const destination = new PublicKey(MOCK_DEST_STRING)

    const result = await createTransaction({
      publicKey,
      destination,
      amount: 1,
      connection: mockLegacyConnection as unknown as import('@solana/web3.js').Connection,
    })

    expect(result).toHaveProperty('transaction')
    expect(result).toHaveProperty('latestBlockhash')
    expect(result.latestBlockhash.blockhash).toBe(MOCK_BLOCKHASH)
    expect(result.latestBlockhash.lastValidBlockHeight).toBe(MOCK_BLOCK_HEIGHT)
  })

  it('should construct a VersionedTransaction from the compiled legacy message', async () => {
    const publicKey = new PublicKey(MOCK_PUBKEY_STRING)
    const destination = new PublicKey(MOCK_DEST_STRING)

    await createTransaction({
      publicKey,
      destination,
      amount: 0.5,
      connection: mockLegacyConnection as unknown as import('@solana/web3.js').Connection,
    })

    // VersionedTransaction mock is vi.fn() — check it was called
    expect(VersionedTransaction).toHaveBeenCalledWith('compiled-legacy-message')
  })

  it('should create SystemProgram.transfer instruction with 1 SOL in lamports', async () => {
    const publicKey = new PublicKey(MOCK_PUBKEY_STRING)
    const destination = new PublicKey(MOCK_DEST_STRING)

    await createTransaction({
      publicKey,
      destination,
      amount: 1,
      connection: mockLegacyConnection as unknown as import('@solana/web3.js').Connection,
    })

    // 1 SOL = 1_000_000_000 lamports (LAMPORTS_PER_SOL)
    expect(SystemProgram.transfer).toHaveBeenCalledWith(expect.objectContaining({ lamports: 1_000_000_000 }))
  })

  it('should floor fractional lamport amounts', async () => {
    const publicKey = new PublicKey(MOCK_PUBKEY_STRING)
    const destination = new PublicKey(MOCK_DEST_STRING)

    // 0.333333... SOL → should be floored
    await createTransaction({
      publicKey,
      destination,
      amount: 0.333333333,
      connection: mockLegacyConnection as unknown as import('@solana/web3.js').Connection,
    })

    const call = vi.mocked(SystemProgram.transfer).mock.calls[0][0]
    expect(Number.isInteger(call.lamports)).toBe(true)
  })

  it('should accept a Kit Address string as publicKey (not a PublicKey instance)', async () => {
    // Kit Address is just a branded string — not a PublicKey instance
    const kitAddress = MOCK_PUBKEY_STRING as unknown as import('@solana/kit').Address
    const kitDest = MOCK_DEST_STRING as unknown as import('@solana/kit').Address

    const result = await createTransaction({
      publicKey: kitAddress,
      destination: kitDest,
      amount: 1,
      connection: mockLegacyConnection as unknown as import('@solana/web3.js').Connection,
    })

    expect(result).toHaveProperty('transaction')
    expect(result).toHaveProperty('latestBlockhash')
  })

  it('should accept legacy PublicKey instance as publicKey', async () => {
    const publicKey = new PublicKey(MOCK_PUBKEY_STRING)
    const destination = new PublicKey(MOCK_DEST_STRING)

    const result = await createTransaction({
      publicKey,
      destination,
      amount: 2,
      connection: mockLegacyConnection as unknown as import('@solana/web3.js').Connection,
    })

    expect(result).toHaveProperty('transaction')
  })
})

// ---------------------------------------------------------------------------
// addComputeBudgetInstructions
// ---------------------------------------------------------------------------

describe('addComputeBudgetInstructions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call transaction.add exactly twice', () => {
    const tx = new Transaction() as unknown as import('@solana/web3.js').Transaction
    addComputeBudgetInstructions(tx, 200_000, 100_000)

    expect(tx.add).toHaveBeenCalledTimes(2)
  })

  it('should call ComputeBudgetProgram.setComputeUnitLimit with the given units', () => {
    const tx = new Transaction() as unknown as import('@solana/web3.js').Transaction
    addComputeBudgetInstructions(tx, 300_000, 50_000)

    expect(ComputeBudgetProgram.setComputeUnitLimit).toHaveBeenCalledWith({ units: 300_000 })
  })

  it('should call ComputeBudgetProgram.setComputeUnitPrice with the given microLamports', () => {
    const tx = new Transaction() as unknown as import('@solana/web3.js').Transaction
    addComputeBudgetInstructions(tx, 200_000, 75_000)

    expect(ComputeBudgetProgram.setComputeUnitPrice).toHaveBeenCalledWith({ microLamports: 75_000 })
  })

  it('should add computeUnitLimit instruction as the first transaction.add call', () => {
    const tx = new Transaction() as unknown as import('@solana/web3.js').Transaction
    addComputeBudgetInstructions(tx, 200_000, 100_000)

    // First call should be the unit-limit instruction
    expect(vi.mocked(tx.add).mock.calls[0][0]).toBe('computeUnitLimitInstruction')
  })

  it('should add computeUnitPrice instruction as the second transaction.add call', () => {
    const tx = new Transaction() as unknown as import('@solana/web3.js').Transaction
    addComputeBudgetInstructions(tx, 200_000, 100_000)

    // Second call should be the priority-fee instruction
    expect(vi.mocked(tx.add).mock.calls[1][0]).toBe('computeUnitPriceInstruction')
  })

  it('should not throw when called with zero values', () => {
    const tx = new Transaction() as unknown as import('@solana/web3.js').Transaction
    expect(() => addComputeBudgetInstructions(tx, 0, 0)).not.toThrow()
  })

  it('should return void (undefined)', () => {
    const tx = new Transaction() as unknown as import('@solana/web3.js').Transaction
    const result = addComputeBudgetInstructions(tx, 200_000, 100_000)

    expect(result).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// getFreshBlockhash
// ---------------------------------------------------------------------------

describe('getFreshBlockhash', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLatestBlockhashLegacy.mockResolvedValue({
      blockhash: MOCK_BLOCKHASH,
      lastValidBlockHeight: MOCK_BLOCK_HEIGHT,
    })
  })

  it('should return blockhash and lastValidBlockHeight from Kit RPC on success', async () => {
    mockSend.mockResolvedValueOnce({
      value: {
        blockhash: 'KitBlockhash111',
        lastValidBlockHeight: BigInt(99999),
      },
    })

    const result = await getFreshBlockhash(mockKitRpc, mockLegacyConnection as unknown as import('@solana/web3.js').Connection)

    expect(result.blockhash).toBe('KitBlockhash111')
    expect(result.lastValidBlockHeight).toBe(99999)
  })

  it('should convert Kit lastValidBlockHeight from BigInt to number', async () => {
    mockSend.mockResolvedValueOnce({
      value: {
        blockhash: 'KitBlockhash222',
        lastValidBlockHeight: BigInt(200000),
      },
    })

    const result = await getFreshBlockhash(mockKitRpc, mockLegacyConnection as unknown as import('@solana/web3.js').Connection)

    expect(typeof result.lastValidBlockHeight).toBe('number')
    expect(result.lastValidBlockHeight).toBe(200000)
  })

  it('should fall back to legacy connection when Kit RPC throws', async () => {
    mockSend.mockRejectedValueOnce(new Error('Kit RPC connection failed'))
    mockGetLatestBlockhashLegacy.mockResolvedValueOnce({
      blockhash: 'LegacyBlockhash',
      lastValidBlockHeight: 54321,
    })

    const result = await getFreshBlockhash(mockKitRpc, mockLegacyConnection as unknown as import('@solana/web3.js').Connection)

    expect(result.blockhash).toBe('LegacyBlockhash')
    expect(result.lastValidBlockHeight).toBe(54321)
  })

  it('should call legacy getLatestBlockhash with "finalized" commitment on fallback', async () => {
    mockSend.mockRejectedValueOnce(new Error('timeout'))

    await getFreshBlockhash(mockKitRpc, mockLegacyConnection as unknown as import('@solana/web3.js').Connection)

    expect(mockGetLatestBlockhashLegacy).toHaveBeenCalledWith('finalized')
  })

  it('should not call the legacy connection when Kit RPC succeeds', async () => {
    mockSend.mockResolvedValueOnce({
      value: {
        blockhash: 'KitSuccess',
        lastValidBlockHeight: BigInt(1),
      },
    })

    await getFreshBlockhash(mockKitRpc, mockLegacyConnection as unknown as import('@solana/web3.js').Connection)

    expect(mockGetLatestBlockhashLegacy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// calculateDynamicPriorityFee
// ---------------------------------------------------------------------------

describe('calculateDynamicPriorityFee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return minimum fee of 25_000 when calculated fee is below minimum', async () => {
    // Very low fees → p75 calculation yields < 25_000
    mockSend.mockResolvedValueOnce([
      { prioritizationFee: BigInt(1) },
      { prioritizationFee: BigInt(2) },
      { prioritizationFee: BigInt(3) },
      { prioritizationFee: BigInt(4) },
    ])

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(result).toBeGreaterThanOrEqual(25_000)
  })

  it('should cap the fee at 1_000_000 microlamports when calculated fee exceeds maximum', async () => {
    mockSend.mockResolvedValueOnce([
      { prioritizationFee: BigInt(5_000_000) },
      { prioritizationFee: BigInt(6_000_000) },
      { prioritizationFee: BigInt(7_000_000) },
      { prioritizationFee: BigInt(8_000_000) },
    ])

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(result).toBeLessThanOrEqual(1_000_000)
  })

  it('should return 100_000 default when all fees are zero', async () => {
    mockSend.mockResolvedValueOnce([{ prioritizationFee: BigInt(0) }, { prioritizationFee: BigInt(0) }])

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(result).toBe(100_000)
  })

  it('should return 200_000 fallback when fees array is empty', async () => {
    mockSend.mockResolvedValueOnce([])

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(result).toBe(200_000)
  })

  it('should return 200_000 fallback when fees is null', async () => {
    mockSend.mockResolvedValueOnce(null)

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(result).toBe(200_000)
  })

  it('should return 250_000 conservative fallback when RPC call throws', async () => {
    mockSend.mockRejectedValueOnce(new Error('Network error'))

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(result).toBe(250_000)
  })

  it('should log a warning when the RPC call throws', async () => {
    mockSend.mockRejectedValueOnce(new Error('RPC failure'))

    await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Error calculating dynamic priority fee'), expect.anything())
  })

  it('should correctly calculate 75th percentile with 25% buffer for 8 fees', async () => {
    // nonZero fees sorted: 10k, 20k, 30k, 40k, 50k, 60k, 70k, 800k
    // p75 index = floor(8 * 0.75) = 6 → 70_000
    // recommendedFee = floor(70_000 * 1.25) = 87_500
    // clamped: max(87_500, 25_000) = 87_500; min(87_500, 1_000_000) = 87_500
    mockSend.mockResolvedValueOnce([
      { prioritizationFee: BigInt(10_000) },
      { prioritizationFee: BigInt(800_000) },
      { prioritizationFee: BigInt(30_000) },
      { prioritizationFee: BigInt(20_000) },
      { prioritizationFee: BigInt(50_000) },
      { prioritizationFee: BigInt(40_000) },
      { prioritizationFee: BigInt(70_000) },
      { prioritizationFee: BigInt(60_000) },
    ])

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(result).toBe(87_500)
  })

  it('should filter out zero fees before percentile calculation', async () => {
    // nonZero fees sorted: [50_000, 100_000]
    // p75 index = floor(2 * 0.75) = 1 → 100_000
    // recommendedFee = floor(100_000 * 1.25) = 125_000, clamped = 125_000
    mockSend.mockResolvedValueOnce([
      { prioritizationFee: BigInt(0) },
      { prioritizationFee: BigInt(50_000) },
      { prioritizationFee: BigInt(0) },
      { prioritizationFee: BigInt(100_000) },
    ])

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(result).toBe(125_000)
  })

  it('should always return a number', async () => {
    mockSend.mockResolvedValueOnce([{ prioritizationFee: BigInt(500_000) }])

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(typeof result).toBe('number')
  })

  it('should floor the recommended fee (no fractional microlamports)', async () => {
    // p75 = 40_000, * 1.25 = 50_000 exactly (integer) — still verifying floor behavior
    mockSend.mockResolvedValueOnce([{ prioritizationFee: BigInt(30_000) }, { prioritizationFee: BigInt(40_000) }])
    // sorted: [30k, 40k], p75 index = floor(2 * 0.75) = 1 → 40_000
    // recommendedFee = floor(40_000 * 1.25) = 50_000

    const result = await calculateDynamicPriorityFee(mockKitRpc, mockLogger)

    expect(Number.isInteger(result)).toBe(true)
    expect(result).toBe(50_000)
  })
})

// ---------------------------------------------------------------------------
// confirmTransactionWithParallelStrategy
// ---------------------------------------------------------------------------

describe('confirmTransactionWithParallelStrategy', () => {
  const TX_SIG = 'testSignature111111111111111111111111111111111111111111111111'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return confirmed=true and method="kit" when Kit RPC returns confirmed status', async () => {
    mockSend.mockResolvedValue({
      value: [{ confirmationStatus: 'confirmed', err: null }],
    })
    mockGetSignatureStatus.mockResolvedValue({ value: null })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      500_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.confirmed).toBe(true)
    expect(result.method).toBe('kit')
  })

  it('should return confirmed=true when Kit RPC returns finalized status', async () => {
    mockSend.mockResolvedValue({
      value: [{ confirmationStatus: 'finalized', err: null }],
    })
    mockGetSignatureStatus.mockResolvedValue({ value: null })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      500_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.confirmed).toBe(true)
    expect(result.method).toBe('kit')
  })

  it('should return confirmed=false when Kit status has an error field', async () => {
    mockSend.mockResolvedValue({
      value: [{ confirmationStatus: 'processed', err: { code: 'InstructionError' } }],
    })
    mockGetSignatureStatus.mockResolvedValue({
      value: { confirmationStatus: 'processed', err: { code: 'InstructionError' } },
    })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      500_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.confirmed).toBe(false)
  })

  it('should return confirmationTime as a non-negative number', async () => {
    mockSend.mockResolvedValue({
      value: [{ confirmationStatus: 'confirmed', err: null }],
    })
    mockGetSignatureStatus.mockResolvedValue({ value: null })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      100_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(typeof result.confirmationTime).toBe('number')
    expect(result.confirmationTime).toBeGreaterThanOrEqual(0)
  })

  it('should include method in the result and it must be "kit" or "legacy"', async () => {
    mockSend.mockResolvedValue({
      value: [{ confirmationStatus: 'confirmed', err: null }],
    })
    mockGetSignatureStatus.mockResolvedValue({ value: null })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      100_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(['kit', 'legacy']).toContain(result.method)
  })

  it('should fall back to legacy when Kit RPC throws and legacy confirms', async () => {
    mockSend.mockRejectedValue(new Error('Kit unavailable'))
    mockGetSignatureStatus.mockResolvedValue({
      value: { confirmationStatus: 'confirmed', err: null },
    })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      100_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.confirmed).toBe(true)
    expect(result.method).toBe('legacy')
  })

  it('should return confirmed=true with method="legacy" when legacy connection confirms', async () => {
    // Kit returns no status (null entry), legacy immediately confirms
    mockSend.mockResolvedValue({ value: [null] })
    mockGetSignatureStatus.mockResolvedValue({
      value: { confirmationStatus: 'finalized', err: null },
    })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      100_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.confirmed).toBe(true)
    expect(result.method).toBe('legacy')
  })

  it('should return confirmed=false when legacy connection returns an error status', async () => {
    mockSend.mockResolvedValue({ value: [null] })
    mockGetSignatureStatus.mockResolvedValue({
      value: { confirmationStatus: 'processed', err: { InstructionError: [0, 'Custom'] } },
    })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      50_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.confirmed).toBe(false)
    expect(result.method).toBe('legacy')
  })

  it('should return confirmation payload with expected fields', async () => {
    mockSend.mockResolvedValue({
      value: [{ confirmationStatus: 'confirmed', err: null }],
    })
    mockGetSignatureStatus.mockResolvedValue({ value: null })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      100_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual(
      expect.objectContaining({
        confirmed: expect.any(Boolean),
        method: expect.any(String),
        confirmationTime: expect.any(Number),
      })
    )
  })

  it('should resolve correctly with high priority fee (> 100_000, maxChecks = 90)', async () => {
    mockSend.mockResolvedValue({
      value: [{ confirmationStatus: 'confirmed', err: null }],
    })
    mockGetSignatureStatus.mockResolvedValue({ value: null })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      200_000, // > 100_000 → uses 90 max checks
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.confirmed).toBe(true)
  })

  it('should resolve correctly with standard priority fee (<= 100_000, maxChecks = 60)', async () => {
    mockSend.mockResolvedValue({
      value: [{ confirmationStatus: 'finalized', err: null }],
    })
    mockGetSignatureStatus.mockResolvedValue({ value: null })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      50_000, // <= 100_000 → uses 60 max checks
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.confirmed).toBe(true)
  })

  it('should handle parallel race — fastest confirmer wins', async () => {
    // Kit and legacy both resolve; whichever resolves first wins
    mockSend.mockResolvedValue({
      value: [{ confirmationStatus: 'confirmed', err: null }],
    })
    mockGetSignatureStatus.mockResolvedValue({
      value: { confirmationStatus: 'confirmed', err: null },
    })

    const promise = confirmTransactionWithParallelStrategy(
      TX_SIG,
      100_000,
      mockKitRpc,
      mockLegacyConnection as unknown as import('@solana/web3.js').Connection
    )
    await vi.runAllTimersAsync()
    const result = await promise

    // Either kit or legacy can win; confirmed must be true
    expect(result.confirmed).toBe(true)
    expect(['kit', 'legacy']).toContain(result.method)
  })
})
