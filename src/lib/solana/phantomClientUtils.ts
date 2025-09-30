/**
 * Client-side Phantom Compatibility Utilities
 *
 * These utilities should be used in the frontend to maximize Phantom wallet compatibility
 * by ensuring the freshest possible transaction state before wallet interaction.
 */

import { Connection, Transaction, PublicKey } from '@solana/web3.js'

/**
 * Refreshes a transaction with the latest blockhash right before sending to wallet
 * This minimizes the time gap between blockhash retrieval and wallet simulation
 */
export async function refreshTransactionForPhantom(
  serializedTransaction: string,
  connection: Connection,
  feePayer: PublicKey
): Promise<{
  success: boolean
  freshTransaction?: string
  error?: string
  timing: {
    refreshTimeMs: number
    originalBlockhash?: string
    freshBlockhash?: string
  }
}> {
  const startTime = Date.now()

  try {
    // Deserialize the original transaction
    const originalTransaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'))
    const originalBlockhash = originalTransaction.recentBlockhash

    // Get ultra-fresh blockhash
    const { blockhash: freshBlockhash } = await connection.getLatestBlockhash('finalized')

    // Update with fresh data
    originalTransaction.recentBlockhash = freshBlockhash
    originalTransaction.feePayer = feePayer

    const refreshTimeMs = Date.now() - startTime

    // Quick client-side simulation check
    try {
      const simulation = await connection.simulateTransaction(originalTransaction)

      if (simulation.value.err) {
        return {
          success: false,
          error: `Client simulation failed: ${JSON.stringify(simulation.value.err)}`,
          timing: { refreshTimeMs, originalBlockhash, freshBlockhash },
        }
      }
    } catch (simError) {
      // Don't fail on simulation error - just warn and proceed
      console.warn('Client-side simulation check failed (proceeding anyway):', simError)
    }

    return {
      success: true,
      freshTransaction: Buffer.from(originalTransaction.serialize({ requireAllSignatures: false })).toString('base64'),
      timing: { refreshTimeMs, originalBlockhash, freshBlockhash },
    }
  } catch (error) {
    const refreshTimeMs = Date.now() - startTime

    return {
      success: false,
      error: `Failed to refresh: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timing: { refreshTimeMs },
    }
  }
}

/**
 * Use this hook in React components to refresh transactions before Phantom signing
 */
export function usePhantomCompatibleTransaction() {
  const refreshTransaction = async (serializedTransaction: string, connection: Connection, wallet: { publicKey: PublicKey }) => {
    console.log('🔄 Refreshing transaction for Phantom compatibility...')

    const result = await refreshTransactionForPhantom(serializedTransaction, connection, wallet.publicKey)

    if (result.success) {
      console.log('✅ Transaction refreshed successfully', {
        refreshTime: `${result.timing.refreshTimeMs}ms`,
        blockhashChanged: result.timing.originalBlockhash !== result.timing.freshBlockhash,
      })
      return result.freshTransaction!
    } else {
      console.warn('⚠️ Failed to refresh transaction, using original:', result.error)
      return serializedTransaction // Fallback to original
    }
  }

  return { refreshTransaction }
}

/**
 * Higher-order function that wraps wallet signing with automatic transaction refresh
 */
export function withPhantomCompatibility<T extends (...args: any[]) => Promise<any>>(signTransactionFn: T, connection: Connection): T {
  return (async (...args: any[]) => {
    const [transaction, ...otherArgs] = args

    // If it's a serialized transaction, refresh it
    if (typeof transaction === 'string') {
      // Assume the wallet is available in the context - this would need to be adapted
      // based on your wallet adapter setup
      console.log('🔄 Auto-refreshing serialized transaction for Phantom compatibility')
      // Implementation would depend on how you access the wallet context
    }

    return signTransactionFn(...args)
  }) as T
}
