/**
 * verifyPreparedTransactions — bounds on how many transactions a request may be split into and on the
 * priority fee they carry in total (a compromised server could otherwise burn fees across many
 * transactions, each below the per-transaction cap).
 */

import { describe, it, expect } from 'vitest'
import { ComputeBudgetProgram, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import {
  getMaxTransactionCount,
  MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION,
  MAX_TOTAL_PRIORITY_FEE_LAMPORTS,
  verifyPreparedTransactions,
} from '../verifyPreparedTransactions'
import type { ExpectedOperation, PreparedTransactionExpectation } from '../transactionExpectation'

const WALLET = Keypair.generate().publicKey
const FEE_WALLET = Keypair.generate().publicKey
const BLOCKHASH = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N'

const recipients = (count: number): PublicKey[] => Array.from({ length: count }, () => Keypair.generate().publicKey)

const solTransfers = (to: readonly PublicKey[]): ExpectedOperation => ({
  kind: 'sol-transfers',
  payments: to.map((recipient) => ({ recipient: recipient.toBase58(), amount: 1 })),
})

const expectationFor = (operation: ExpectedOperation): PreparedTransactionExpectation => ({
  wallet: WALLET.toBase58(),
  feeWallet: FEE_WALLET.toBase58(),
  maxServiceFeeLamports: BigInt(1_000_000),
  operation,
})

/** A transaction with an explicit compute budget that pays `to` 1 SOL each. */
const batch = (to: readonly PublicKey[], unitLimit: number, unitPrice: number): Transaction =>
  new Transaction({ feePayer: WALLET, recentBlockhash: BLOCKHASH }).add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice }),
    ...to.map((recipient): TransactionInstruction => SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: recipient, lamports: 1e9 }))
  )

const reasonsOf = (result: ReturnType<typeof verifyPreparedTransactions>): string[] => (result.ok ? [] : result.reasons)

/** Splits `to` into transactions of `size` recipients, each with the given compute budget. */
const batches = (to: readonly PublicKey[], size: number, unitLimit: number, unitPrice: number): Transaction[] =>
  Array.from({ length: Math.ceil(to.length / size) }, (_, index) => batch(to.slice(index * size, (index + 1) * size), unitLimit, unitPrice))

describe('getMaxTransactionCount', () => {
  it('should allow one transaction for single-transaction operations', () => {
    expect(getMaxTransactionCount({ kind: 'burn', mint: 'm', tokenAccount: 'a', amount: 1 })).toBe(1)
    expect(getMaxTransactionCount({ kind: 'revoke-authority', mint: 'm', authority: 'mint' })).toBe(1)
    expect(getMaxTransactionCount({ kind: 'revoke-metadata-authority', mint: 'm' })).toBe(1)
  })

  it('should scale batched operations with the recipient and wallet counts', () => {
    expect(getMaxTransactionCount(solTransfers(recipients(1)))).toBe(1)
    expect(getMaxTransactionCount(solTransfers(recipients(4)))).toBe(1)
    expect(getMaxTransactionCount(solTransfers(recipients(5)))).toBe(2)
    expect(getMaxTransactionCount(solTransfers(recipients(500)))).toBe(125)
    expect(getMaxTransactionCount({ kind: 'freeze', mint: 'm', targetWallets: Array.from({ length: 11 }, () => 'w') })).toBe(3)
    expect(getMaxTransactionCount({ kind: 'thaw', mint: 'm', targetWallets: ['w'] })).toBe(1)
  })
})

describe('verifyPreparedTransactions — transaction count and total priority fee', () => {
  it('should reject a one-recipient request split into five max-priority transactions (probe)', () => {
    const to = recipients(1)
    // 5 x (1.4M CU at 1,428,571 µL/CU = ~0.002 SOL each): under the per-transaction cap, 0.010 SOL together
    const transactions = Array.from({ length: 5 }, () => batch(to, 1_400_000, 1_428_571))

    const reasons = reasonsOf(verifyPreparedTransactions(transactions, expectationFor(solTransfers(to))))

    expect(reasons).toEqual(['The server returned 5 transactions, but this request needs at most 1, so it was not accepted'])
  })

  it('should reject more transactions than freeze batches of the wallet count could need', () => {
    const wallets = recipients(10).map((wallet) => wallet.toBase58())
    const transactions = Array.from({ length: 3 }, () => batch(recipients(1), 100_000, 1))

    const reasons = reasonsOf(
      verifyPreparedTransactions(transactions, expectationFor({ kind: 'freeze', mint: 'mint', targetWallets: wallets }))
    )

    expect(reasons).toEqual(['The server returned 3 transactions, but this request needs at most 2, so it was not accepted'])
  })

  it('should accept a realistic multisend in server-sized batches at the maximum dynamic priority fee', () => {
    const to = recipients(35)
    // Server: 10 recipients per transaction, 1M µL/CU cap, compute limit up to 1.4M (Token-2022 batches)
    const transactions = batches(to, 10, 1_400_000, 1_000_000)

    const result = verifyPreparedTransactions(transactions, expectationFor(solTransfers(to)))

    expect(result).toMatchObject({ ok: true, summary: { transactionCount: 4 } })
  })

  it('should accept the worst legitimate multisend (500 recipients, 9 per transaction, 1.4M CU at 1M µL/CU)', () => {
    const to = recipients(500)
    const transactions = batches(to, 9, 1_400_000, 1_000_000)
    expect(transactions).toHaveLength(56)

    // 56 x 0.0014 SOL = 0.0784 SOL, under the 0.1 SOL total cap
    expect(verifyPreparedTransactions(transactions, expectationFor(solTransfers(to)))).toMatchObject({ ok: true })
  })

  it('should reject a total priority fee above the absolute cap even when each transaction is under its cap', () => {
    const to = recipients(500)
    // 51 transactions x 0.002 SOL = 0.102 SOL > 0.1 SOL; the transaction count (51 of 125 allowed) is fine
    const transactions = batches(to.slice(0, 51), 1, 1_000_000, 2_000_000)
    expect(MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION * BigInt(51)).toBeGreaterThan(MAX_TOTAL_PRIORITY_FEE_LAMPORTS)

    const reasons = reasonsOf(verifyPreparedTransactions(transactions, expectationFor(solTransfers(to))))

    expect(reasons).toContain('The transactions set priority fees of 0.102 SOL in total, more than the 0.1 SOL this request needs at most')
  })

  it('should keep the per-transaction cap for a single-transaction tool', () => {
    const to = recipients(1)
    const atCap = batch(to, 1_000_000, Number(MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION))
    const overCap = batch(to, 1_000_001, Number(MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION))

    expect(verifyPreparedTransactions([atCap], expectationFor(solTransfers(to))).ok).toBe(true)
    expect(reasonsOf(verifyPreparedTransactions([overCap], expectationFor(solTransfers(to))))).toEqual([
      'The transaction sets a priority fee of 0.002000002 SOL (limit 0.002 SOL)',
    ])
  })
})
