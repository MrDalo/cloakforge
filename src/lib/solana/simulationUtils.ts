/**
 * Transaction Simulation Utilities
 *
 * Utilities for validating transaction simulation to prevent wallet simulation failures.
 * Helps catch issues before wallet submission that cause "Transaction reverted during simulation" warnings.
 */

import { Connection, Transaction } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'

export interface SimulationResult {
  success: boolean
  error?: string
  computeUnitsConsumed?: number
  logs?: string[]
}

/**
 * Test transaction simulation to catch issues before wallet submission
 * This helps prevent Phantom wallet simulation warnings while maintaining successful execution
 *
 * @param transaction Transaction to simulate
 * @param connection Solana connection
 * @returns Promise<SimulationResult>
 */
export async function validateTransactionSimulation(transaction: Transaction, connection: Connection): Promise<SimulationResult> {
  const logger = getLogger({
    context: 'simulation-utils',
    function: 'validateTransactionSimulation',
  })

  try {
    // Clone transaction to avoid mutations
    const testTransaction = Transaction.from(transaction.serialize({ requireAllSignatures: false }))

    // Simulate the transaction using the simpler overload that works with Transaction type
    const simulation = await connection.simulateTransaction(testTransaction, undefined, true)

    if (simulation.value.err) {
      logger.warn('Transaction simulation failed', {
        error: simulation.value.err,
        logs: simulation.value.logs,
        instructionCount: testTransaction.instructions.length,
      })

      return {
        success: false,
        error: `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
        logs: simulation.value.logs || [],
      }
    }

    logger.info('Transaction simulation successful', {
      computeUnitsConsumed: simulation.value.unitsConsumed,
      instructionCount: testTransaction.instructions.length,
      logs: simulation.value.logs?.slice(-3), // Last 3 log entries for context
    })

    return {
      success: true,
      computeUnitsConsumed: simulation.value.unitsConsumed,
      logs: simulation.value.logs || [],
    }
  } catch (error) {
    logger.error('Simulation validation failed', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown simulation error',
    }
  }
}

/**
 * Estimate optimal compute units for a transaction based on simulation
 *
 * @param transaction Transaction to analyze
 * @param connection Solana connection
 * @returns Promise<number> Recommended compute unit limit
 */
export async function estimateComputeUnits(transaction: Transaction, connection: Connection): Promise<number> {
  const logger = getLogger({
    context: 'simulation-utils',
    function: 'estimateComputeUnits',
  })

  try {
    const simulationResult = await validateTransactionSimulation(transaction, connection)

    if (simulationResult.success && simulationResult.computeUnitsConsumed) {
      // Add 25% buffer to the consumed units for safety
      const recommendedUnits = Math.ceil(simulationResult.computeUnitsConsumed * 1.25)

      logger.debug('Compute unit estimation completed', {
        consumed: simulationResult.computeUnitsConsumed,
        recommended: recommendedUnits,
      })

      return recommendedUnits
    }

    // Fallback to conservative default if simulation fails
    logger.warn('Could not estimate compute units from simulation, using default', {
      error: simulationResult.error,
    })

    return 200000 // Conservative fallback
  } catch (error) {
    logger.error('Compute unit estimation failed', error)
    return 200000 // Conservative fallback
  }
}
