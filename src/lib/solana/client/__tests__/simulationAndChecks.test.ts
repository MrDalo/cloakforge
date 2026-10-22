/**
 * Lookup-table loading, simulation policy and the verifyBeforeSigning glue the hooks call.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  AddressLookupTableAccount,
  type Connection,
  Keypair,
  type PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import { fetchAddressLookupTables } from '../decodePreparedTransaction'
import { MAX_SIMULATION_LOG_LINES, SIMULATION_CONCURRENCY, simulatePreparedTransactions } from '../simulatePreparedTransactions'
import { assertPreparedTransactionsSimulate, verifyBeforeSigning } from '../verifyBeforeSigning'
import type { PreparedTransactionExpectation } from '../transactionExpectation'

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

const WALLET = Keypair.generate().publicKey
const RECIPIENT = Keypair.generate().publicKey
const BLOCKHASH = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N'

const lookupTable = (...addresses: PublicKey[]): AddressLookupTableAccount =>
  new AddressLookupTableAccount({
    key: Keypair.generate().publicKey,
    state: { deactivationSlot: BigInt('18446744073709551615'), lastExtendedSlot: 0, lastExtendedSlotStartIndex: 0, addresses },
  })

const paymentTransaction = (lamports: number, tables: AddressLookupTableAccount[] = []): VersionedTransaction =>
  new VersionedTransaction(
    new TransactionMessage({
      payerKey: WALLET,
      recentBlockhash: BLOCKHASH,
      instructions: [SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: RECIPIENT, lamports })],
    }).compileToV0Message(tables)
  )

const expectation: PreparedTransactionExpectation = {
  wallet: WALLET.toBase58(),
  feeWallet: Keypair.generate().publicKey.toBase58(),
  maxServiceFeeLamports: BigInt(0),
  operation: { kind: 'sol-transfers', payments: [{ recipient: RECIPIENT.toBase58(), amount: 1 }] },
}

const simulateResult = (err: unknown = null, logs: string[] | null = []) => ({ context: { slot: 1 }, value: { err, logs } })

const connectionWith = (overrides: Partial<Record<keyof Connection, unknown>>): Connection => overrides as unknown as Connection

describe('fetchAddressLookupTables', () => {
  it('should not call the RPC when no transaction uses a lookup table', async () => {
    const getAddressLookupTable = vi.fn()
    const legacy = new Transaction({ feePayer: WALLET, recentBlockhash: BLOCKHASH })

    await expect(fetchAddressLookupTables(connectionWith({ getAddressLookupTable }), [legacy, paymentTransaction(1)])).resolves.toEqual([])
    expect(getAddressLookupTable).not.toHaveBeenCalled()
  })

  it('should load each referenced table once through the client connection', async () => {
    const table = lookupTable(RECIPIENT)
    const getAddressLookupTable = vi.fn().mockResolvedValue({ context: { slot: 1 }, value: table })

    const tables = await fetchAddressLookupTables(connectionWith({ getAddressLookupTable }), [
      paymentTransaction(1, [table]),
      paymentTransaction(2, [table]),
    ])

    expect(tables).toEqual([table])
    expect(getAddressLookupTable).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['missing', vi.fn().mockResolvedValue({ context: { slot: 1 }, value: null })],
    ['unreachable', vi.fn().mockRejectedValue(new Error('fetch failed'))],
  ])('should fail closed when a table is %s', async (_label, getAddressLookupTable) => {
    await expect(
      fetchAddressLookupTables(connectionWith({ getAddressLookupTable }), [paymentTransaction(1, [lookupTable(RECIPIENT)])])
    ).rejects.toMatchObject({ code: 'TRANSACTION_VERIFICATION_FAILED' })
  })
})

describe('simulatePreparedTransactions', () => {
  it('should simulate without signature checks against the latest blockhash, wrapping legacy transactions', async () => {
    const simulateTransaction = vi.fn().mockResolvedValue(simulateResult())
    const legacy = new Transaction({ feePayer: WALLET, recentBlockhash: BLOCKHASH }).add(
      SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: RECIPIENT, lamports: 1 })
    )

    await expect(simulatePreparedTransactions(connectionWith({ simulateTransaction }), [legacy])).resolves.toEqual([{ status: 'passed' }])
    expect(simulateTransaction).toHaveBeenCalledWith(expect.any(VersionedTransaction), {
      sigVerify: false,
      replaceRecentBlockhash: true,
      commitment: 'confirmed',
    })
  })

  it('should report a simulation error with the tail of the logs, each line shortened', async () => {
    const logs = Array.from({ length: 10 }, (_, i) => `log line ${i} ${'x'.repeat(300)}`)
    const simulateTransaction = vi.fn().mockResolvedValue(simulateResult({ InstructionError: [2, { Custom: 1 }] }, logs))

    const [outcome] = await simulatePreparedTransactions(connectionWith({ simulateTransaction }), [paymentTransaction(1)])

    expect(outcome.status).toBe('failed')
    if (outcome.status !== 'failed') return
    expect(outcome.error).toBe('{"InstructionError":[2,{"Custom":1}]}')
    expect(outcome.logs).toHaveLength(MAX_SIMULATION_LOG_LINES)
    expect(outcome.logs[0]).toMatch(/^log line 4 x+…$/)
    expect(outcome.logs[0].length).toBeLessThanOrEqual(161)
  })

  it('should report an RPC failure as unavailable instead of throwing', async () => {
    const simulateTransaction = vi.fn().mockRejectedValue(new Error('429 Too Many Requests'))

    await expect(simulatePreparedTransactions(connectionWith({ simulateTransaction }), [paymentTransaction(1)])).resolves.toEqual([
      { status: 'unavailable', error: '429 Too Many Requests' },
    ])
  })

  it(`should run at most ${SIMULATION_CONCURRENCY} simulations at a time`, async () => {
    let running = 0
    let peak = 0
    const simulateTransaction = vi.fn(async () => {
      running++
      peak = Math.max(peak, running)
      await new Promise((resolve) => setTimeout(resolve, 1))
      running--
      return simulateResult()
    })

    const transactions = Array.from({ length: 10 }, (_, i) => paymentTransaction(i + 1))
    const outcomes = await simulatePreparedTransactions(connectionWith({ simulateTransaction }), transactions)

    expect(outcomes).toHaveLength(10)
    expect(peak).toBe(SIMULATION_CONCURRENCY)
  })
})

describe('verifyBeforeSigning', () => {
  const check = (connection: Connection, transactions = [paymentTransaction(1e9)]) => ({ connection, transactions, toolId: 'test-tool' })

  let simulateTransaction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    simulateTransaction = vi.fn().mockResolvedValue(simulateResult())
  })

  it('should return the spending summary when the transactions match and simulate', async () => {
    const summary = await verifyBeforeSigning(check(connectionWith({ simulateTransaction })), expectation)

    expect(summary.paymentLamports).toBe(BigInt(1e9))
    expect(simulateTransaction).toHaveBeenCalledTimes(1)
  })

  it('should throw TRANSACTION_VERIFICATION_FAILED with at most three reasons and never simulate', async () => {
    const attackers = Array.from({ length: 5 }, () => Keypair.generate().publicKey)
    const tampered = new VersionedTransaction(
      new TransactionMessage({
        payerKey: WALLET,
        recentBlockhash: BLOCKHASH,
        instructions: attackers.map((attacker) => SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: attacker, lamports: 1 })),
      }).compileToV0Message()
    )

    const error = await verifyBeforeSigning(check(connectionWith({ simulateTransaction }), [tampered]), expectation).catch(
      (caught: unknown) => caught
    )

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ code: 'TRANSACTION_VERIFICATION_FAILED' })
    expect((error as AppError).message).toMatch(
      /^The prepared transaction does not match your request, so it was not sent to your wallet: /
    )
    expect((error as AppError).message).toContain('(and 3 more)')
    expect(simulateTransaction).not.toHaveBeenCalled()
  })

  it('should throw SIMULATION_FAILED with the failing transaction and the end of its logs', async () => {
    simulateTransaction
      .mockResolvedValueOnce(simulateResult())
      .mockResolvedValueOnce(
        simulateResult('InsufficientFundsForRent', ['Program 11111111111111111111111111111111 failed: insufficient lamports'])
      )
    const transactions = [paymentTransaction(1e9), paymentTransaction(2)]
    // Simulation is independent of the request checks (two transactions for one payment would not pass those)
    await expect(assertPreparedTransactionsSimulate(check(connectionWith({ simulateTransaction }), transactions))).rejects.toMatchObject({
      code: 'SIMULATION_FAILED',
      message:
        'Transaction simulation failed (transaction 2 of 2): InsufficientFundsForRent. Program log: Program 11111111111111111111111111111111 failed: insufficient lamports. Nothing was sent to your wallet.',
    })
  })

  it('should continue when the simulation itself is unavailable, since the checks passed', async () => {
    simulateTransaction.mockRejectedValue(new Error('fetch failed'))

    await expect(verifyBeforeSigning(check(connectionWith({ simulateTransaction })), expectation)).resolves.toMatchObject({
      paymentLamports: BigInt(1e9),
    })
  })
})
