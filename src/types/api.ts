/**
 * API Request and Response Types
 *
 * Shared types for API communication between client and server.
 * These types ensure consistency across the application boundary.
 */

import { ResponseStatus } from './error'
import type { TokenCreatorRequest, UnsignedTokenCreationResponse } from './tokenCreator'

// Re-export unified token creator types
export type { TokenCreatorRequest, UnsignedTokenCreationResponse }

// Base API Response Type
export type ApiResponseBase<T = null> = {
  status_code: number
  status: ResponseStatus
  error_message: string
  error_code?: string // For programmatic error handling
  data: T | null // Allow null for error responses
}

// Burn Tokens API Types
export interface BurnTokensRequest {
  walletAddress: string
  tokenAccountAddress: string
  mintAddress: string
  amount: number // In token units (not raw amount)
  decimals: number
  tokenSymbol?: string
  tokenName?: string
}

export interface UnsignedBurnTransactionResponse {
  serializedTransaction: string // Base64 encoded unsigned transaction
  rawAmount: string // Amount to be burned in raw token units (with decimals)
  uiAmount: number // Amount to be burned in UI token units
  tokenAccount: string
  mint: string
  message: string
}
