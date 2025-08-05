/**
 * Modern Solana Utilities using Solana Kit
 *
 * This file contains utility functions for Solana operations using both:
 * - @solana/kit for modern RPC and connection handling
 * - Legacy libraries where Kit support is not yet available
 */

import { createSolanaRpc, address, type Address } from '@solana/kit'
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import { getLogger } from '../logger/logger'
import getConfig from '@/lib/config/config'

/**
 * Get current Solana price from server-side API route
 * This avoids CORS issues by using our own API endpoint
 */
export const getSolanaPrice = async (): Promise<number> => {
  const logger = getLogger({
    file: 'lib/solana/utils.ts',
    action: 'getSolanaPrice',
  })

  try {
    const response = await axios.get('/api/solana/price', {
      timeout: 10000,
    })

    // Handle the new unified API response format
    if (response.data.status === 'success' && response.data.data?.price !== undefined) {
      return response.data.data.price || 0
    } else if (response.data.status === 'error') {
      logger.error('API returned error:', response.data.error_message, {
        errorCode: response.data.error_code,
      })
      return 0
    } else {
      // Fallback for any unexpected response format
      logger.warn('Unexpected API response format:', response.data)
      return response.data.price || 0
    }
  } catch (error) {
    logger.error('Failed to fetch Solana price:', error)
    return 0
  }
}

/**
 * Get wallet balance using modern Kit RPC
 */
export const getWalletBalance = async (walletAddress: Address | string): Promise<number> => {
  const { rpcEndpoint } = getConfig()
  const rpc = createSolanaRpc(rpcEndpoint)

  try {
    const kitAddress = typeof walletAddress === 'string' ? address(walletAddress) : walletAddress
    const balance = await rpc.getBalance(kitAddress).send()
    return Number(balance) / LAMPORTS_PER_SOL
  } catch (error) {
    const logger = getLogger({
      file: 'lib/solana/utils.ts',
      action: 'getWalletBalance',
    })
    logger.error('Failed to fetch wallet balance:', error)
    return 0
  }
}

/**
 * Create a simple SOL transfer transaction (legacy format for wallet compatibility)
 */
export const createTransaction = async ({
  publicKey,
  destination,
  amount,
  connection,
}: {
  publicKey: PublicKey
  destination: PublicKey
  amount: number
  connection: Connection
}): Promise<{
  transaction: VersionedTransaction
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number }
}> => {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash()

  // Create instructions to send, in this case a simple transfer
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: destination,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  ]

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage()

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy)

  return {
    transaction,
    latestBlockhash,
  }
}

/**
 * Validate Solana address format
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Shorten Solana address for display
 */
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return ''
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Convert lamports to SOL
 */
export const lamportsToSol = (lamports: number | bigint): number => Number(lamports) / LAMPORTS_PER_SOL

/**
 * Convert SOL to lamports
 */
export const solToLamports = (sol: number): number => Math.floor(sol * LAMPORTS_PER_SOL)

/**
 * Helper to stringify BigInt safely
 */
export const safeJsonStringify = (obj: unknown): string =>
  JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value))

/**
 * Helper function to fetch an image from a URI with timeout
 */
export const fetchImage = async (uri: string): Promise<string | null> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(uri, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const metadata = await response.json()
    return metadata.image || null
  } catch (error) {
    const logger = getLogger({
      file: 'lib/solana/utils.ts',
      action: 'fetchImage',
    })
    logger.warn('Failed to fetch image from URI', { error, uri })
    return null
  }
}

/**
 * Check if RPC endpoint is responding
 */
export const isRpcHealthy = async (rpcEndpoint?: string): Promise<boolean> => {
  try {
    const endpoint = rpcEndpoint || getConfig().rpcEndpoint
    const rpc = createSolanaRpc(endpoint)

    // Try to get the latest blockhash as a health check
    await rpc.getLatestBlockhash().send()
    return true
  } catch {
    return false
  }
}

/**
 * Get cluster info from RPC endpoint
 */
export const getClusterInfo = async (): Promise<{ cluster: string; version?: string }> => {
  const { rpcEndpoint } = getConfig()

  if (rpcEndpoint.includes('devnet')) {
    return { cluster: 'devnet' }
  } else if (rpcEndpoint.includes('testnet')) {
    return { cluster: 'testnet' }
  } else if (rpcEndpoint.includes('mainnet')) {
    return { cluster: 'mainnet-beta' }
  } else {
    return { cluster: 'custom' }
  }
}
