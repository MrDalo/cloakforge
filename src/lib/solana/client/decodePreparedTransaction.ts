/**
 * Decodes server-prepared transactions (legacy or v0) into the exact instructions the wallet will sign.
 */

import {
  type AddressLookupTableAccount,
  type Connection,
  type PublicKey,
  Transaction,
  TransactionMessage,
  type TransactionInstruction,
  type VersionedMessage,
  type VersionedTransaction,
} from '@solana/web3.js'
import { AppError } from '@/lib/errors'

/** A transaction returned by a CloakForge API route, after deserialization. */
export type PreparedTransaction = Transaction | VersionedTransaction

export interface DecodedPreparedTransaction {
  /** First account of the message: pays the network fee */
  feePayer: string
  /** Every account whose signature the message requires (fee payer first) */
  requiredSigners: string[]
  /** Top-level instructions with fully resolved accounts */
  instructions: TransactionInstruction[]
}

/**
 * Returns the message the wallet signs. A legacy transaction is compiled exactly as the wallet adapter
 * compiles it, so call this after the final blockhash and fee payer are set.
 *
 * @param transaction - Deserialized prepared transaction.
 * @returns The compiled message.
 */
const getSignedMessage = (transaction: PreparedTransaction): VersionedMessage =>
  transaction instanceof Transaction ? transaction.compileMessage() : transaction.message

/**
 * Lists the address lookup tables referenced by v0 messages (unique, in first-seen order).
 *
 * @param transactions - Prepared transactions.
 * @returns Lookup table addresses.
 */
const getAddressLookupTableKeys = (transactions: readonly PreparedTransaction[]): PublicKey[] => {
  const keys = new Map<string, PublicKey>()
  for (const transaction of transactions) {
    if (transaction instanceof Transaction) continue
    for (const lookup of transaction.message.addressTableLookups) {
      keys.set(lookup.accountKey.toBase58(), lookup.accountKey)
    }
  }
  return [...keys.values()]
}

/**
 * Loads every address lookup table the prepared transactions reference, through the client's own RPC
 * connection (never from the server response), so their accounts can be verified before signing.
 *
 * @param connection - Client RPC connection.
 * @param transactions - Prepared transactions.
 * @returns The resolved lookup tables (empty when none are used).
 * @throws AppError TRANSACTION_VERIFICATION_FAILED when a table cannot be loaded (fail closed).
 */
export async function fetchAddressLookupTables(
  connection: Connection,
  transactions: readonly PreparedTransaction[]
): Promise<AddressLookupTableAccount[]> {
  const keys = getAddressLookupTableKeys(transactions)

  return Promise.all(
    keys.map(async (key) => {
      let table: AddressLookupTableAccount | null = null
      try {
        table = (await connection.getAddressLookupTable(key)).value
      } catch {
        table = null
      }
      if (!table) {
        throw new AppError(
          'TRANSACTION_VERIFICATION_FAILED',
          `The prepared transaction uses an address lookup table (${key.toBase58()}) that could not be loaded, so it cannot be checked. It was not sent to your wallet.`
        )
      }
      return table
    })
  )
}

/**
 * Decodes a prepared transaction into its fee payer, required signers and resolved instructions.
 *
 * @param transaction - Deserialized prepared transaction (final blockhash already set).
 * @param lookupTables - Lookup tables from {@link fetchAddressLookupTables}.
 * @returns The decoded transaction.
 * @throws Error when the message is malformed or references an unresolved lookup table.
 */
export function decodePreparedTransaction(
  transaction: PreparedTransaction,
  lookupTables: readonly AddressLookupTableAccount[] = []
): DecodedPreparedTransaction {
  const message = getSignedMessage(transaction)
  const decompiled = TransactionMessage.decompile(message, { addressLookupTableAccounts: [...lookupTables] })

  return {
    feePayer: decompiled.payerKey.toBase58(),
    requiredSigners: message.staticAccountKeys.slice(0, message.header.numRequiredSignatures).map((key) => key.toBase58()),
    instructions: decompiled.instructions,
  }
}
