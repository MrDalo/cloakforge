/**
 * Unified Token Creator Types
 *
 * This file contains all token creation related types to avoid duplication
 * and ensure consistency across the application.
 */

import { PublicKey, Keypair, Transaction } from '@solana/web3.js'
// Hook parameters (client-side processing)
export interface TokenCreatorParams {
  name: string
  symbol: string
  description?: string
  decimals: number
  totalSupply: number
  immutable?: boolean
  revokeFreezeAuthority?: boolean
  revokeMintAuthority?: boolean
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  logo?: File // Logo file for IPFS upload
}

// API request token data (server expects numbers)
export interface TokenCreatorApiData {
  name: string
  symbol: string
  description?: string
  decimals: number
  totalSupply: number
  immutable?: boolean
  revokeFreezeAuthority?: boolean
  revokeMintAuthority?: boolean
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
}

// Server-side transaction creation parameters
export interface CreateTokenTransactionParams {
  /** Wallet's public key (token creator and authority) */
  walletPublicKey: PublicKey
  /** Token data for creation */
  tokenData: TokenCreatorApiData
  /** Optional IPFS metadata URI */
  metadataUri?: string
}

// Transaction creation result
export interface CreateTokenTransactionResult {
  /** The constructed transaction ready to be signed and sent */
  transaction: Transaction
  /** Generated mint public key */
  mintPublicKey: string
  /** The mint keypair (needed for signing) */
  mintKeypair: Keypair
  /** Associated token account address */
  tokenAccountAddress: string
  /** Total supply to be minted (as string for precision) */
  totalSupply: string
}

// Hook execution result (client-side success response)
export interface TokenCreatorResult {
  /** Generated mint public key */
  mintAddress: string
  /** Transaction signature */
  signature: string
  /** Token name that was created */
  tokenName: string
  /** Token symbol that was created */
  tokenSymbol: string
  /** Success message */
  message: string
}

// API request interface
export interface TokenCreatorRequest {
  walletAddress: string
  tokenData: TokenCreatorApiData
  metadata?: {
    logoUri?: string // IPFS URI for uploaded logo
    metadataUri?: string // IPFS URI for metadata JSON
  }
}

// API response interface
export interface UnsignedTokenCreationResponse {
  serializedTransaction: string // Base64 encoded unsigned transaction
  mintPublicKey: string // The mint account public key
  mintSecretKey: number[] // The mint keypair secret key for client-side signing
  message: string
}
