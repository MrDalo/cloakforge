/**
 * Modern Solana Utilities using Solana Kit
 *
 * This file contains utility functions for Solana operations using both:
 * - @solana/kit for modern RPC and connection handling
 * - Legacy libraries where Kit support is not yet available
 */

import { createSolanaRpc, address, type Address, lamports, isAddress, signature } from '@solana/kit'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  Transaction,
  ComputeBudgetProgram,
} from '@solana/web3.js'
import axios from 'axios'
import { getLogger } from '../logger/logger'
import getConfig from '@/lib/config/config'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '../utils/solanaErrorCodes'

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
 * Create a simple SOL transfer transaction using Kit types where possible
 * Note: Still uses legacy transaction creation for wallet compatibility
 */
export const createTransaction = async ({
  publicKey,
  destination,
  amount,
  connection,
}: {
  publicKey: PublicKey | Address
  destination: PublicKey | Address
  amount: number
  connection: Connection
}): Promise<{
  transaction: VersionedTransaction
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number }
}> => {
  // Convert Kit addresses to legacy PublicKeys if needed
  const fromPubkey = publicKey instanceof PublicKey ? publicKey : new PublicKey(publicKey)
  const toPubkey = destination instanceof PublicKey ? destination : new PublicKey(destination)

  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash()

  // Create instructions to send, in this case a simple transfer
  // Using Kit lamports helper for type safety
  const transferAmount = lamports(BigInt(Math.floor(amount * LAMPORTS_PER_SOL)))
  const instructions = [
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: Number(transferAmount), // Convert back to number for legacy compatibility
    }),
  ]

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: fromPubkey,
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
 * Validate Solana address format using Kit's isAddress
 */
export const isValidSolanaAddress = (addressString: string): boolean => {
  try {
    return isAddress(addressString)
  } catch {
    return false
  }
}

/**
 * Shorten Solana address for display (works with both Kit addresses and strings)
 */
export const shortenAddress = (addr: string | Address, chars = 4): string => {
  const addressString = typeof addr === 'string' ? addr : addr
  if (!addressString) return ''
  if (addressString.length <= chars * 2) return addressString
  return `${addressString.slice(0, chars)}...${addressString.slice(-chars)}`
}

/**
 * Convert lamports to SOL
 */
export const lamportsToSol = (lamports: number | bigint): number => Number(lamports) / LAMPORTS_PER_SOL

/**
 * Convert SOL to lamports using Kit's lamports helper
 */
export const solToLamports = (sol: number): bigint => lamports(BigInt(Math.floor(sol * LAMPORTS_PER_SOL)))

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

/**
 * Convert between Kit Address and legacy PublicKey types
 */
export const convertAddressToPublicKey = (addr: Address): PublicKey => new PublicKey(addr)

/**
 * Convert legacy PublicKey to Kit Address
 */
export const convertPublicKeyToAddress = (publicKey: PublicKey): Address => address(publicKey.toString())

/**
 * Create Kit RPC connection helper
 */
export const createKitRpc = (endpoint?: string): ReturnType<typeof createSolanaRpc> => {
  const rpcEndpoint = endpoint || getConfig().rpcEndpoint
  return createSolanaRpc(rpcEndpoint)
}

/**
 * Create reusable connection pair for consistent RPC operations
 * This prevents connection multiplicity and rate limiting issues
 */
export const createConnectionPair = (
  endpoint?: string
): {
  kitRpc: ReturnType<typeof createSolanaRpc>
  legacyConnection: Connection
} => {
  const rpcEndpoint = endpoint || getConfig().rpcEndpoint
  return {
    kitRpc: createSolanaRpc(rpcEndpoint),
    legacyConnection: new Connection(rpcEndpoint, 'confirmed'),
  }
}

/**
 * Calculate dynamic priority fee based on recent network activity
 * Reusable across all tools for optimal transaction inclusion
 */
export const calculateDynamicPriorityFee = async (
  rpc: ReturnType<typeof createSolanaRpc>,
  logger: ReturnType<typeof getLogger>
): Promise<number> => {
  try {
    // Get recent prioritization fees from network
    const recentFees = await rpc.getRecentPrioritizationFees().send()

    if (recentFees && recentFees.length > 0) {
      // Calculate statistics from recent fees - convert MicroLamports to numbers
      const fees = recentFees.map((fee) => Number(fee.prioritizationFee))
      const nonZeroFees = fees.filter((fee) => fee > 0)

      if (nonZeroFees.length === 0) {
        const noFeesDefault = 100_000
        return noFeesDefault
      }

      // Calculate percentiles for smart fee selection
      const sortedFees = [...nonZeroFees].sort((a, b) => a - b)
      const p75 = sortedFees[Math.floor(sortedFees.length * 0.75)] || 0

      // Use 75th percentile + 25% buffer for competitive inclusion
      const recommendedFee = Math.floor(p75 * 1.25)

      // Set reasonable bounds (min 25k, max 1M microLamports)
      const minFee = 25_000
      const maxFeeCap = 1_000_000
      const finalFee = Math.min(Math.max(recommendedFee, minFee), maxFeeCap)

      return finalFee
    } else {
      const fallbackFee = 200_000
      return fallbackFee
    }
  } catch (error) {
    const errorFallbackFee = 250_000
    logger.error('Error calculating dynamic priority fee - using conservative fallback', error)
    return errorFallbackFee
  }
}

/**
 * Check wallet balance with detailed validation
 * Reusable across all tools
 */
export const validateWalletBalance = async (
  walletAddress: Address | string,
  requiredAmount: number,
  kitRpc: ReturnType<typeof createSolanaRpc>,
  legacyConnection: Connection,
  logger: ReturnType<typeof getLogger>
): Promise<{ hasEnoughBalance: boolean; balance: number; balanceSOL: number }> => {
  const kitWalletAddress = address(typeof walletAddress === 'string' ? walletAddress : walletAddress)

  try {
    // Try Kit RPC first, fallback to legacy connection
    let balance: bigint
    try {
      const balanceResponse = await kitRpc.getBalance(kitWalletAddress).send()
      balance = balanceResponse.value
    } catch (kitError) {
      logger.warn('Kit RPC balance check failed, using legacy connection fallback', {
        error: kitError instanceof Error ? kitError.message : String(kitError),
      })
      const legacyPubkey = new PublicKey(typeof walletAddress === 'string' ? walletAddress : walletAddress)
      const legacyBalance = await legacyConnection.getBalance(legacyPubkey)
      balance = BigInt(legacyBalance)
    }

    const balanceSOL = Number(balance) / LAMPORTS_PER_SOL
    const hasEnoughBalance = Number(balance) >= requiredAmount

    if (!hasEnoughBalance) {
      const shortfall = requiredAmount - Number(balance)
      logger.warn('Insufficient wallet balance', {
        shortfallSOL: (shortfall / LAMPORTS_PER_SOL).toFixed(6),
      })
    }

    return {
      hasEnoughBalance,
      balance: Number(balance),
      balanceSOL,
    }
  } catch (error) {
    logger.error('Failed to check wallet balance', error)
    throw new SolanaError('Failed to check wallet balance', SOLANA_ERROR_CODES.RPC_ERROR)
  }
}

/**
 * Add compute budget instructions to a transaction
 * Reusable across all tools for consistent compute budget handling
 */
export const addComputeBudgetInstructions = (transaction: Transaction, computeUnits: number, priorityFeeMicroLamports: number): void => {
  // Add compute unit limit
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    })
  )

  // Add priority fee
  const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFeeMicroLamports,
  })
  transaction.add(priorityFeeInstruction)
}

/**
 * Get fresh blockhash using Kit RPC with legacy fallback
 * Reusable across all tools for optimal transaction timing
 */
export const getFreshBlockhash = async (
  kitRpc: ReturnType<typeof createSolanaRpc>,
  legacyConnection: Connection,
  logger: ReturnType<typeof getLogger>
): Promise<{ blockhash: string; lastValidBlockHeight: number }> => {
  try {
    // Try Kit RPC first for optimal performance
    const kitBlockhash = await kitRpc.getLatestBlockhash().send()
    const blockhash = kitBlockhash.value.blockhash
    const lastValidBlockHeight = Number(kitBlockhash.value.lastValidBlockHeight)
    return { blockhash, lastValidBlockHeight }
  } catch (kitError) {
    // Fallback to legacy connection if Kit RPC fails
    logger.warn('Kit RPC blockhash failed, using legacy connection fallback', {
      error: kitError instanceof Error ? kitError.message : String(kitError),
      fallbackMethod: 'legacyConnection.getLatestBlockhash',
    })
    const legacyBlockhash = await legacyConnection.getLatestBlockhash()
    return {
      blockhash: legacyBlockhash.blockhash,
      lastValidBlockHeight: legacyBlockhash.lastValidBlockHeight,
    }
  }
}

/**
 * Parallel transaction confirmation strategy with network-adaptive timeouts
 * Reusable across all tools for fastest confirmation
 */
export const confirmTransactionWithParallelStrategy = async (
  txSignature: string,
  priorityFeeMicroLamports: number,
  kitRpc: ReturnType<typeof createSolanaRpc>,
  legacyConnection: Connection,
  logger: ReturnType<typeof getLogger>
): Promise<{ confirmed: boolean; method: string; confirmationTime: number }> => {
  try {
    const confirmationStart = Date.now()

    // Network-adaptive polling
    const adaptivePolling = async (): Promise<{ confirmed: boolean; status: string; slot?: number }> => {
      const maxPolls = 60 // ~30 seconds with 500ms intervals
      let pollCount = 0
      const baseInterval = 500

      while (pollCount < maxPolls) {
        try {
          const status = await legacyConnection.getSignatureStatus(txSignature)

          if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
            return {
              confirmed: true,
              status: status.value.confirmationStatus,
              slot: status.value.slot || undefined,
            }
          }

          if (status.value?.err) {
            return { confirmed: false, status: 'failed' }
          }

          // Adaptive interval based on poll count
          const interval = baseInterval + Math.floor(pollCount / 10) * 100
          await new Promise((resolve) => setTimeout(resolve, interval))
          pollCount++
        } catch {
          await new Promise((resolve) => setTimeout(resolve, baseInterval))
          pollCount++
        }
      }

      return { confirmed: false, status: 'timeout' }
    }

    // Kit confirmation with network-adaptive timeout
    const kitConfirmation = async (): Promise<{ confirmed: boolean; method: string }> => {
      try {
        // Use Kit RPC to check transaction status
        const maxChecks = priorityFeeMicroLamports > 100_000 ? 90 : 60 // More checks for high-priority txs
        let checkCount = 0

        while (checkCount < maxChecks) {
          // Convert string signature to Kit signature type
          const kitSignature = signature(txSignature)
          const signatureStatus = await kitRpc.getSignatureStatuses([kitSignature]).send()
          const status = signatureStatus.value[0]

          if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
            return { confirmed: true, method: 'kit' }
          }

          if (status?.err) {
            return { confirmed: false, method: 'kit' }
          }

          await new Promise((resolve) => setTimeout(resolve, 500))
          checkCount++
        }

        return { confirmed: false, method: 'kit' }
      } catch {
        return { confirmed: false, method: 'kit' }
      }
    }

    // Use Promise.race for fastest confirmation detection
    const winner = await Promise.race([
      adaptivePolling().then((result) => ({ ...result, method: 'polling' })),
      kitConfirmation().then((result) => ({ ...result, method: 'kit' })),
    ])

    const confirmationTime = Date.now() - confirmationStart

    if (winner.confirmed) {
      return { confirmed: true, method: winner.method, confirmationTime }
    } else {
      return { confirmed: false, method: winner.method, confirmationTime }
    }
  } catch (error) {
    logger.error('Parallel confirmation strategy failed', error)
    return { confirmed: false, method: 'error', confirmationTime: 0 }
  }
}

/**
 * Send transaction with retries and optimal settings
 * Reusable across all tools for consistent transaction sending
 */
export const sendTransactionWithRetry = async (
  transaction: Transaction,
  expectedSignature: string,
  legacyConnection: Connection,
  logger: ReturnType<typeof getLogger>
): Promise<string> => {
  try {
    const txSignature = await legacyConnection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'processed',
      maxRetries: 3,
    })

    return txSignature
  } catch (error) {
    logger.error('Transaction send failed', error)
    throw new SolanaError('Failed to send transaction', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
  }
}
