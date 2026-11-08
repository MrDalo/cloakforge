/**
 * verifyPreparedTransactions — edge cases on hand-built transactions (the server-built happy paths and
 * attack variants live in verifyPreparedTransactions.builders.test.ts).
 */

import { describe, it, expect } from 'vitest'
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { address, createNoopSigner } from '@solana/kit'
import { getUpdateTokenMetadataUpdateAuthorityInstruction } from '@solana-program/token-2022'
import { kitInstructionToWeb3Instruction } from '@/lib/solana'
import { MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION, verifyPreparedTransactions } from '../verifyPreparedTransactions'
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS, MEMO_PROGRAM_ADDRESS } from '../programAddresses'
import type { ExpectedOperation, PreparedTransactionExpectation } from '../transactionExpectation'

const WALLET = Keypair.generate().publicKey
const FEE_WALLET = Keypair.generate().publicKey
const RECIPIENT = Keypair.generate().publicKey
const MINT = Keypair.generate().publicKey
const BLOCKHASH = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N'

const solPayment: ExpectedOperation = { kind: 'sol-transfers', payments: [{ recipient: RECIPIENT.toBase58(), amount: 1 }] }

const expectation = (operation: ExpectedOperation = solPayment, overrides: Partial<PreparedTransactionExpectation> = {}) => ({
  wallet: WALLET.toBase58(),
  feeWallet: FEE_WALLET.toBase58(),
  maxServiceFeeLamports: BigInt(1_000_000),
  operation,
  ...overrides,
})

const legacy = (...instructions: TransactionInstruction[]): Transaction => {
  const transaction = new Transaction({ feePayer: WALLET, recentBlockhash: BLOCKHASH })
  return transaction.add(...instructions)
}

const versioned = (instructions: TransactionInstruction[], lookupTables: AddressLookupTableAccount[] = []): VersionedTransaction =>
  new VersionedTransaction(
    new TransactionMessage({ payerKey: WALLET, recentBlockhash: BLOCKHASH, instructions }).compileToV0Message(lookupTables)
  )

const lookupTableWith = (...addresses: PublicKey[]): AddressLookupTableAccount =>
  new AddressLookupTableAccount({
    key: Keypair.generate().publicKey,
    state: { deactivationSlot: BigInt('18446744073709551615'), lastExtendedSlot: 0, lastExtendedSlotStartIndex: 0, addresses },
  })

const pay = (to: PublicKey, lamports: number, from: PublicKey = WALLET): TransactionInstruction =>
  SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports })

const reasonsOf = (result: ReturnType<typeof verifyPreparedTransactions>): string[] => (result.ok ? [] : result.reasons)

describe('verifyPreparedTransactions', () => {
  it('should reject an empty transaction list', () => {
    expect(reasonsOf(verifyPreparedTransactions([], expectation()))).toEqual(['The server returned no transactions'])
  })

  it('should accept a payment plus the fee and report the totals', () => {
    const result = verifyPreparedTransactions([legacy(pay(RECIPIENT, 1e9), pay(FEE_WALLET, 1_000_000))], expectation())

    expect(result).toMatchObject({
      ok: true,
      summary: { paymentLamports: BigInt(1e9), serviceFeeLamports: BigInt(1_000_000), paymentIndexesByTransaction: [[0]] },
    })
  })

  it('should resolve accounts loaded from an address lookup table', () => {
    const table = lookupTableWith(RECIPIENT)
    const transaction = versioned([pay(RECIPIENT, 1e9)], [table])
    expect(transaction.message.addressTableLookups).toHaveLength(1)

    expect(verifyPreparedTransactions([transaction], expectation(), [table]).ok).toBe(true)
    expect(reasonsOf(verifyPreparedTransactions([transaction], expectation()))).toEqual([
      'The transaction cannot be decoded',
      `Missing payment of 1 SOL to ${RECIPIENT.toBase58()}`,
    ])
  })

  it('should accept fees to any address only within the displayed fee when the fee wallet is not pinned (development)', () => {
    const unpinned = expectation(solPayment, { feeWallet: null })
    const anyAddress = Keypair.generate().publicKey

    const accepted = verifyPreparedTransactions([legacy(pay(RECIPIENT, 1e9), pay(anyAddress, 1_000_000))], unpinned)
    expect(accepted.ok).toBe(true)
    expect(accepted.warnings).toEqual([expect.stringContaining('NEXT_PUBLIC_FEE_WALLET_ADDRESS is not set')])

    const rejected = verifyPreparedTransactions([legacy(pay(RECIPIENT, 1e9), pay(anyAddress, 50_000_000))], unpinned)
    expect(reasonsOf(rejected)).toEqual(['The service fee is 0.05 SOL, more than the 0.001 SOL you were shown'])
  })

  it('should tolerate a few lamports of fee rounding but nothing more', () => {
    expect(verifyPreparedTransactions([legacy(pay(RECIPIENT, 1e9), pay(FEE_WALLET, 1_010_000))], expectation()).ok).toBe(true)
    expect(verifyPreparedTransactions([legacy(pay(RECIPIENT, 1e9), pay(FEE_WALLET, 1_010_001))], expectation()).ok).toBe(false)
  })

  it('should reject SOL moved from an account other than the wallet', () => {
    const other = Keypair.generate().publicKey
    const reasons = reasonsOf(verifyPreparedTransactions([legacy(pay(RECIPIENT, 1e9, other))], expectation()))

    expect(reasons).toContain(`The transaction transfers SOL from ${other.toBase58()} instead of your wallet`)
    expect(reasons).toContain(`The transaction requires an unexpected signer ${other.toBase58()}`)
  })

  it('should reject System Program instructions other than transfers and expected account creation', () => {
    const assign = SystemProgram.assign({ accountPubkey: WALLET, programId: Keypair.generate().publicKey })
    const create = SystemProgram.createAccount({
      fromPubkey: WALLET,
      newAccountPubkey: WALLET,
      lamports: 1,
      space: 0,
      programId: TOKEN_PROGRAM_ID,
    })

    expect(reasonsOf(verifyPreparedTransactions([legacy(pay(RECIPIENT, 1e9), assign, create)], expectation()))).toEqual([
      'The transaction contains an unexpected System Program instruction (Assign)',
      `The transaction creates an unexpected account ${WALLET.toBase58()}`,
    ])
  })

  it('should reject unexpected or repeated compute budget instructions', () => {
    const transaction = legacy(
      ComputeBudgetProgram.requestHeapFrame({ bytes: 64 * 1024 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
      pay(RECIPIENT, 1e9)
    )

    expect(reasonsOf(verifyPreparedTransactions([transaction], expectation()))).toEqual([
      'The transaction contains an unexpected compute budget instruction (RequestHeapFrame)',
      'The transaction sets the priority fee more than once',
    ])
  })

  it('should bound the priority fee with the default compute limit when none is set', () => {
    // 1 program instruction → 200,000 CU by default: 10^10 µL/CU * 200,000 CU = 2 SOL
    const transaction = legacy(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000_000_000 }), pay(RECIPIENT, 1e9))
    expect(reasonsOf(verifyPreparedTransactions([transaction], expectation()))).toEqual([
      'The transaction sets a priority fee of 2 SOL (limit 0.002 SOL)',
    ])

    const atLimit = legacy(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: Number(MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION) }),
      pay(RECIPIENT, 1e9)
    )
    expect(verifyPreparedTransactions([atLimit], expectation())).toMatchObject({
      ok: true,
      summary: { networkFeeLamports: BigInt(5_000) + MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION },
    })
  })

  it('should reject a transaction that performs none of the requested operations (fee-burning filler)', () => {
    const memo = new TransactionInstruction({ programId: new PublicKey(MEMO_PROGRAM_ADDRESS), keys: [], data: Buffer.from('filler') })
    const filler = legacy(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_428_571 }),
      memo
    )
    const feeOnly = legacy(memo, pay(FEE_WALLET, 1_000_000))
    const payment = legacy(pay(RECIPIENT, 1e9))

    // 9 payments allow 3 transactions; only the first transaction pays anyone
    const ninePayments: ExpectedOperation = {
      kind: 'sol-transfers',
      payments: [RECIPIENT, ...Array.from({ length: 8 }, () => Keypair.generate().publicKey)].map((recipient) => ({
        recipient: recipient.toBase58(),
        amount: 1,
      })),
    }
    const reasons = reasonsOf(verifyPreparedTransactions([payment, filler, feeOnly], expectation(ninePayments)))
    expect(reasons).toContain('Transaction 2 performs none of the operations you asked for')
    expect(reasons).toContain('Transaction 3 performs none of the operations you asked for')
    expect(reasonsOf(verifyPreparedTransactions([versioned([])], expectation()))).toContain(
      'The transaction performs none of the operations you asked for'
    )
  })

  it('should treat a truncated token instruction as malformed', () => {
    const truncatedTransfer = new TransactionInstruction({ programId: TOKEN_PROGRAM_ID, keys: [], data: Buffer.from([12, 1, 2]) })

    expect(reasonsOf(verifyPreparedTransactions([legacy(pay(RECIPIENT, 1e9), truncatedTransfer)], expectation()))).toEqual([
      `The transaction contains a malformed instruction for program ${TOKEN_PROGRAM_ID.toBase58()}`,
    ])
  })

  it('should reject a Token-2022-only instruction sent to the classic Token program', () => {
    const metadataInstruction = kitInstructionToWeb3Instruction(
      getUpdateTokenMetadataUpdateAuthorityInstruction(
        { metadata: address(MINT.toBase58()), updateAuthority: createNoopSigner(address(WALLET.toBase58())), newUpdateAuthority: null },
        { programAddress: address(TOKEN_PROGRAM_ID.toBase58()) }
      )
    )
    const operation: ExpectedOperation = { kind: 'revoke-metadata-authority', mint: MINT.toBase58() }

    expect(reasonsOf(verifyPreparedTransactions([legacy(metadataInstruction)], expectation(operation)))).toEqual([
      'The transaction contains an unexpected token instruction (token instruction #215)',
      'Expected one metadata update authority and/or one metadata pointer revocation, found 0 and 0',
    ])
  })

  it('should reject associated token instructions other than creating the expected accounts', () => {
    const operation: ExpectedOperation = {
      kind: 'token-transfers',
      mint: MINT.toBase58(),
      payments: [{ recipient: RECIPIENT.toBase58(), amount: 1 }],
    }
    const ata = getAssociatedTokenAddressSync(MINT, RECIPIENT)
    const createAta = (ataAddress: PublicKey, data: number[]): TransactionInstruction =>
      new TransactionInstruction({
        programId: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ADDRESS),
        keys: [WALLET, ataAddress, RECIPIENT, MINT, SystemProgram.programId, TOKEN_PROGRAM_ID].map((pubkey, i) => ({
          pubkey,
          isSigner: i === 0,
          isWritable: i < 2,
        })),
        data: Buffer.from(data),
      })

    expect(reasonsOf(verifyPreparedTransactions([legacy(createAta(ata, [2]))], expectation(operation)))).toContain(
      'The transaction contains an unexpected associated token instruction #2'
    )
    expect(reasonsOf(verifyPreparedTransactions([legacy(createAta(WALLET, [1]))], expectation(operation)))).toContain(
      `The transaction creates token account ${WALLET.toBase58()}, which is not the associated token account of ${RECIPIENT.toBase58()}`
    )
  })
})
