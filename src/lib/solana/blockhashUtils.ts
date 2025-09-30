/**
 * Blockhash Utilities
 *
 * Utilities for handling Solana blockhash expiration issues and ensuring
 * fresh blockhashes are used to prevent "Blockhash not found" simulation errors.
 */

import { Connection } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'

/**
 * Check if a blockhash is still valid on the network
 *
 * @param connection Solana connection
 * @param blockhash The blockhash to check
 * @returns Promise<boolean> true if valid, false if expired
 */
export async function isBlockhashValid(connection: Connection, blockhash: string): Promise<boolean> {
  const logger = getLogger({ context: 'blockhash-utils', function: 'isBlockhashValid' })

  try {
    const result = await connection.isBlockhashValid(blockhash)
    logger.debug('Blockhash validity check completed', { blockhash, isValid: result.value })
    return result.value
  } catch (error) {
    logger.warn('Failed to check blockhash validity', {
      error: error instanceof Error ? error.message : String(error),
      blockhash,
    })
    return false
  }
}

/**
 * Get fresh blockhash with retry logic to handle network issues
 *
 * @param connection Solana connection
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise with fresh blockhash and lastValidBlockHeight
 */
export async function getFreshBlockhash(
  connection: Connection,
  maxRetries: number = 3
): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  const logger = getLogger({ context: 'blockhash-utils', function: 'getFreshBlockhash' })

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await connection.getLatestBlockhash('confirmed')
      logger.debug('Successfully retrieved fresh blockhash', {
        blockhash: result.blockhash,
        lastValidBlockHeight: result.lastValidBlockHeight,
        attempt,
      })
      return result
    } catch (error) {
      logger.warn(`Failed to get blockhash (attempt ${attempt}/${maxRetries})`, {
        error: error instanceof Error ? error.message : String(error),
      })

      if (attempt === maxRetries) {
        logger.error('All attempts to get fresh blockhash failed', { maxRetries })
        throw new Error(`Failed to get fresh blockhash after ${maxRetries} attempts`)
      }

      // Brief wait before retry to avoid overwhelming the RPC
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // This should never be reached due to the throw above, but TypeScript requires it
  throw new Error('Failed to get fresh blockhash after retries')
}

/**
 * Enhanced blockhash retrieval with timing information for debugging
 *
 * @param connection Solana connection
 * @returns Promise with blockhash, timing info, and validity period
 */
export async function getFreshBlockhashWithTiming(connection: Connection): Promise<{
  blockhash: string
  lastValidBlockHeight: number
  retrievalTimeMs: number
  estimatedExpiryMs: number
}> {
  const logger = getLogger({ context: 'blockhash-utils', function: 'getFreshBlockhashWithTiming' })
  const startTime = Date.now()

  try {
    const result = await connection.getLatestBlockhash('confirmed')
    const retrievalTimeMs = Date.now() - startTime
    const estimatedExpiryMs = Date.now() + 150 * 400 // ~150 slots * 400ms per slot = ~60 seconds

    logger.info('Fresh blockhash retrieved with timing', {
      blockhash: result.blockhash,
      lastValidBlockHeight: result.lastValidBlockHeight,
      retrievalTimeMs,
      estimatedExpiryMs: new Date(estimatedExpiryMs).toISOString(),
    })

    return {
      ...result,
      retrievalTimeMs,
      estimatedExpiryMs,
    }
  } catch (error) {
    const retrievalTimeMs = Date.now() - startTime
    logger.error('Failed to retrieve fresh blockhash with timing', {
      error: error instanceof Error ? error.message : String(error),
      retrievalTimeMs,
    })
    throw error
  }
}
