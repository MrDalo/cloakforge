/**
 * Solana Token Utilities
 *
 * Functions for token metadata, images, and data transformation.
 */

import { getLogger } from '../logger/logger'

/**
 * Helper function to fetch an image from a URI with timeout
 *
 * @param uri - URI to fetch image from
 * @returns Image URL or null if failed
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
      context: 'solana-tokens',
      function: 'fetchImage',
    })
    logger.warn('Failed to fetch image from URI', { error, uri })
    return null
  }
}

/**
 * Helper to stringify BigInt safely in JSON
 *
 * @param obj - Object to stringify
 * @returns JSON string with BigInt values converted to strings
 */
export const safeJsonStringify = (obj: unknown): string =>
  JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value))

/**
 * Format token amount for display
 *
 * @param amount - Raw token amount
 * @param decimals - Token decimals
 * @returns Formatted amount string
 */
export const formatTokenAmount = (amount: number, decimals: number): string => (amount / Math.pow(10, decimals)).toFixed(decimals)
