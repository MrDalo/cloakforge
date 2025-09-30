/**
 * Fresh Transaction Utility
 *
 * Addresses Phantom wallet simulation warnings by providing ultra-fresh transactions
 * right before signing. This minimizes timing issues between server creation and
 * wallet simulation.
 */

import { Connection, Transaction, PublicKey } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'

/**
 * Refreshes a transaction with the latest blockhash and validates it
 * This should be called right before sending to wallet for signing
 */
export async function refreshTransactionForWallet(
  originalTransaction: Transaction,
  connection: Connection,
  feePayer: PublicKey
): Promise<{
  success: boolean
  transaction?: Transaction
  error?: string
  timingInfo?: {
    originalBlockhash: string
    freshBlockhash: string
    refreshTimeMs: number
  }
}> {
  const logger = getLogger({
    context: 'fresh-transaction',
    function: 'refreshTransactionForWallet',
  })

  const startTime = Date.now()

  try {
    // Create a fresh copy of the transaction
    const freshTransaction = Transaction.from(originalTransaction.serialize({ requireAllSignatures: false }))

    // Get the absolute latest blockhash using 'finalized' for maximum freshness
    const { blockhash: freshBlockhash } = await connection.getLatestBlockhash('finalized')

    // Update the transaction with fresh data
    freshTransaction.recentBlockhash = freshBlockhash
    freshTransaction.feePayer = feePayer

    const refreshTimeMs = Date.now() - startTime

    // Quick validation simulation
    const simulation = await connection.simulateTransaction(freshTransaction, undefined, true)

    if (simulation.value.err) {
      logger.warn('Fresh transaction simulation failed', {
        error: simulation.value.err,
        originalBlockhash: originalTransaction.recentBlockhash,
        freshBlockhash,
        refreshTimeMs,
      })

      return {
        success: false,
        error: `Fresh transaction simulation failed: ${JSON.stringify(simulation.value.err)}`,
        timingInfo: {
          originalBlockhash: originalTransaction.recentBlockhash || 'missing',
          freshBlockhash,
          refreshTimeMs,
        },
      }
    }

    logger.info('Transaction refreshed successfully for wallet', {
      originalBlockhash: originalTransaction.recentBlockhash,
      freshBlockhash,
      refreshTimeMs,
      computeUnitsConsumed: simulation.value.unitsConsumed,
      instructionCount: freshTransaction.instructions.length,
    })

    return {
      success: true,
      transaction: freshTransaction,
      timingInfo: {
        originalBlockhash: originalTransaction.recentBlockhash || 'missing',
        freshBlockhash,
        refreshTimeMs,
      },
    }
  } catch (error) {
    const refreshTimeMs = Date.now() - startTime

    logger.error('Failed to refresh transaction for wallet', {
      error,
      refreshTimeMs,
      originalBlockhash: originalTransaction.recentBlockhash,
    })

    return {
      success: false,
      error: `Failed to refresh transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timingInfo: {
        originalBlockhash: originalTransaction.recentBlockhash || 'missing',
        freshBlockhash: 'failed',
        refreshTimeMs,
      },
    }
  }
}

/**
 * Creates a completely fresh transaction using the same instructions
 * This is the most aggressive approach to avoid any timing issues
 */
export async function createFreshTransaction(
  instructions: Transaction['instructions'],
  connection: Connection,
  feePayer: PublicKey
): Promise<{
  success: boolean
  transaction?: Transaction
  error?: string
}> {
  const logger = getLogger({
    context: 'fresh-transaction',
    function: 'createFreshTransaction',
  })

  try {
    // Get ultra-fresh blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized')

    // Create completely new transaction
    const transaction = new Transaction()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = feePayer

    // Add all instructions
    transaction.add(...instructions)

    // Validate the fresh transaction
    const simulation = await connection.simulateTransaction(transaction, undefined, true)

    if (simulation.value.err) {
      logger.warn('Fresh transaction creation failed simulation', {
        error: simulation.value.err,
        blockhash,
        instructionCount: instructions.length,
      })

      return {
        success: false,
        error: `Fresh transaction simulation failed: ${JSON.stringify(simulation.value.err)}`,
      }
    }

    logger.info('Fresh transaction created successfully', {
      blockhash,
      instructionCount: instructions.length,
      computeUnitsConsumed: simulation.value.unitsConsumed,
    })

    return {
      success: true,
      transaction,
    }
  } catch (error) {
    logger.error('Failed to create fresh transaction', error)

    return {
      success: false,
      error: `Failed to create fresh transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
