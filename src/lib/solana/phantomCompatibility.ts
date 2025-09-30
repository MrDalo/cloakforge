/**
 * Phantom Wallet Compatibility Utilities
 *
 * Addresses common simulation discrepancies between server-side and Phantom wallet simulations.
 * Key issues: RPC endpoint differences, timing, and simulation parameter variations.
 */

import { Connection, Transaction, PublicKey } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'

interface PhantomCompatibilityCheck {
  success: boolean
  freshenedTransaction?: Transaction
  error?: string
  recommendations?: string[]
}

/**
 * Prepares transaction for optimal Phantom wallet compatibility
 * Addresses timing and simulation differences that cause warnings
 */
export async function preparePhantomCompatibleTransaction(
  transaction: Transaction,
  connection: Connection,
  payer: PublicKey
): Promise<PhantomCompatibilityCheck> {
  const logger = getLogger({
    context: 'phantom-compatibility',
    function: 'preparePhantomCompatibleTransaction',
  })

  try {
    // Create a fresh copy of the transaction
    const freshTransaction = Transaction.from(transaction.serialize({ requireAllSignatures: false }))

    // CRITICAL: Get the freshest possible blockhash to minimize timing issues
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')

    // Update with ultra-fresh blockhash
    freshTransaction.recentBlockhash = blockhash
    freshTransaction.feePayer = payer

    logger.info('Prepared Phantom-compatible transaction', {
      originalBlockhash: transaction.recentBlockhash,
      freshBlockhash: blockhash,
      lastValidBlockHeight,
      instructionCount: freshTransaction.instructions.length,
    })

    // Test simulation with simple parameters to avoid overload issues
    const simulationResults = await Promise.allSettled([
      connection.simulateTransaction(freshTransaction, undefined, true), // includeAccounts: true
      connection.simulateTransaction(freshTransaction, undefined, false), // includeAccounts: false
      connection.simulateTransaction(freshTransaction), // default parameters
    ])

    const successfulSimulations = simulationResults.filter((result) => result.status === 'fulfilled' && !result.value.value.err)

    if (successfulSimulations.length === 0) {
      logger.warn('All simulation attempts failed', {
        results: simulationResults.map((r, i) => ({
          index: i,
          status: r.status,
          error: r.status === 'fulfilled' ? r.value.value.err : 'rejected',
        })),
      })

      return {
        success: false,
        error: 'Transaction failed simulation with fresh blockhash',
        recommendations: ['Try again in a few seconds', 'Check your internet connection', "Verify account states haven't changed"],
      }
    }

    const successfulSim = (successfulSimulations[0] as PromiseFulfilledResult<{ value: { err: null; unitsConsumed?: number } }>).value.value

    logger.info('Phantom compatibility check passed', {
      computeUnitsConsumed: successfulSim.unitsConsumed,
      successfulSimulations: successfulSimulations.length,
      totalAttempts: simulationResults.length,
    })

    return {
      success: true,
      freshenedTransaction: freshTransaction,
    }
  } catch (error) {
    logger.error('Phantom compatibility check failed', error)

    return {
      success: false,
      error: `Compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recommendations: ['Try refreshing the page', 'Check your wallet connection', 'Ensure sufficient SOL for fees'],
    }
  }
}

/**
 * Enhanced simulation that mimics Phantom's validation approach
 * Tests transaction with various parameters to catch edge cases
 */
export async function validatePhantomSimulation(
  transaction: Transaction,
  connection: Connection
): Promise<{
  compatible: boolean
  issues: string[]
  computeUnits?: number
  warnings: string[]
}> {
  const logger = getLogger({
    context: 'phantom-compatibility',
    function: 'validatePhantomSimulation',
  })

  const issues: string[] = []
  const warnings: string[] = []

  try {
    // Test with different simulation approaches that Phantom might use
    const testCases = [
      { includeAccounts: true, description: 'with account data' },
      { includeAccounts: false, description: 'without account data' },
    ]

    let successfulTests = 0
    let computeUnits: number | undefined

    for (const testCase of testCases) {
      try {
        const result = await connection.simulateTransaction(transaction, undefined, testCase.includeAccounts)

        if (result.value.err) {
          issues.push(`Simulation failed ${testCase.description}: ${JSON.stringify(result.value.err)}`)
        } else {
          successfulTests++
          if (!computeUnits) {
            computeUnits = result.value.unitsConsumed || undefined
          }
        }
      } catch (error) {
        issues.push(`Test case failed ${testCase.description}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (successfulTests === 0) {
      issues.push('All simulation test cases failed')
      return {
        compatible: false,
        issues,
        warnings,
      }
    }

    if (successfulTests < testCases.length) {
      warnings.push(`Only ${successfulTests}/${testCases.length} simulation tests passed`)
    }

    // Additional validation checks
    if (computeUnits && computeUnits > 400_000) {
      warnings.push(`High compute usage detected: ${computeUnits} units`)
    }

    const blockheight = await connection.getBlockHeight()
    if (!transaction.recentBlockhash) {
      issues.push('Transaction missing recent blockhash')
    }

    logger.info('Phantom simulation validation completed', {
      compatible: issues.length === 0,
      successfulTests,
      totalTests: testCases.length,
      computeUnits,
      warnings: warnings.length,
      issues: issues.length,
      currentBlockHeight: blockheight,
    })

    return {
      compatible: issues.length === 0,
      issues,
      computeUnits,
      warnings,
    }
  } catch (error) {
    logger.error('Phantom simulation validation failed', error)

    return {
      compatible: false,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings,
    }
  }
}
