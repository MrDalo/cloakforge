/**
 * API Request and Response Types
 *
 * Shared types for API communication between client and server.
 * These types ensure consistency across the application boundary.
 */

import type { TokenCreatorRequest, UnsignedTokenCreationResponse } from './tokenCreator'
// Re-export unified token creator types
export type { TokenCreatorRequest, UnsignedTokenCreationResponse }
export type ResponseStatus = 'success' | 'error'

// Base API Response Type
export type ApiResponseBase<T = null> = {
  status_code: number
  status: ResponseStatus
  error_message: string
  error_code?: string // For programmatic error handling
  data: T | null // Allow null for error responses
}

export interface UnsignedBurnTransactionResponse {
  serializedTransaction: string // Base64 encoded unsigned transaction
  rawAmount: string // Amount to be burned in raw token units (with decimals)
  uiAmount: number // Amount to be burned in UI token units
  tokenAccount: string
  mint: string
  message: string
}

// ==========================================
// TRANSACTION MULTISENDER
// ==========================================

/** A single recipient of a multisend (amount in UI units, e.g. 1.5 tokens). */
export interface MultisenderRecipient {
  address: string
  amount: number
}

/**
 * Describes which recipients ended up in which prepared transaction.
 * The server packs recipients by transaction size, so the client must not assume a fixed batch size.
 */
export interface MultisenderBatch {
  /** Index (in request order) of the first recipient in this transaction */
  startIndex: number
  /** Number of recipients in this transaction */
  recipientCount: number
  /** Serialized transaction size in bytes (always <= the 1232-byte packet limit) */
  sizeBytes: number
}

/**
 * Response of POST /api/solana/transaction-multisender.
 * All transactions share one blockhash and are meant to be signed in a single wallet approval.
 */
export interface UnsignedMultisenderResponse {
  /** Base64 encoded unsigned v0 transactions, one per batch (a single one when everything fits) */
  serializedTransactions: string[]
  /** Batch metadata, same order and length as serializedTransactions */
  batches: MultisenderBatch[]
  /** Decimals used to scale the amounts — resolved on-chain from the mint (9 for SOL) */
  decimals: number
  message: string
  totalServiceFee: number
  estimatedNetworkFee: number
  blockhash: string
  lastValidBlockHeight: number
}
