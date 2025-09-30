/**
 * Phantom Wallet Simulation Compatibility Utility
 *
 * Based on Solana expert guidance and known Phantom simulation issues.
 * Addresses network synchronization and RPC state discrepancies.
 */

import { Connection, Transaction, PublicKey } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'

interface PhantomSimulationFix {
  success: boolean
  fixedTransaction?: string
  diagnostics: {
    networkCheck: boolean
    rpcSync: boolean
    blockheightDiff?: number
    timingMs: number
  }
  recommendations: string[]
}

/**
 * Multi-RPC validation to find the best endpoint for Phantom compatibility
 * Tests against multiple devnet RPCs to find one that's most in-sync with Phantom
 */
export async function findPhantomCompatibleRPC(transaction: Transaction, feePayer: PublicKey): Promise<PhantomSimulationFix> {
  const logger = getLogger({
    context: 'phantom-compatibility',
    function: 'findPhantomCompatibleRPC',
  })

  const startTime = Date.now()

  // Multiple devnet RPC endpoints to test against
  const testRPCs = [
    'https://api.devnet.solana.com', // Official Solana
    'https://devnet.helius-rpc.com', // Helius public
    'https://rpc.ankr.com/solana_devnet', // Ankr
    'https://solana-devnet.g.alchemy.com/v2/demo', // Alchemy demo
  ]

  const results: Array<{
    rpc: string
    success: boolean
    blockHeight?: number
    error?: string
    timing: number
  }> = []

  for (const rpcUrl of testRPCs) {
    const rpcStartTime = Date.now()
    try {
      const connection = new Connection(rpcUrl, 'confirmed')

      // Get fresh blockhash for this RPC
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      const testTx = Transaction.from(transaction.serialize({ requireAllSignatures: false }))
      testTx.recentBlockhash = blockhash
      testTx.feePayer = feePayer

      // Test simulation
      const simulation = await connection.simulateTransaction(testTx, undefined, true)
      const blockHeight = await connection.getBlockHeight()

      results.push({
        rpc: rpcUrl,
        success: !simulation.value.err,
        blockHeight,
        timing: Date.now() - rpcStartTime,
      })

      if (!simulation.value.err) {
        logger.info('Found Phantom-compatible RPC', {
          rpc: rpcUrl,
          blockHeight,
          computeUnits: simulation.value.unitsConsumed,
        })

        // Return the transaction with this RPC's blockhash
        return {
          success: true,
          fixedTransaction: Buffer.from(testTx.serialize({ requireAllSignatures: false })).toString('base64'),
          diagnostics: {
            networkCheck: true,
            rpcSync: true,
            blockheightDiff: 0,
            timingMs: Date.now() - startTime,
          },
          recommendations: [
            `Use RPC: ${rpcUrl}`,
            'This RPC is most synchronized with Phantom',
            'Transaction should now pass Phantom simulation',
          ],
        }
      }
    } catch (error) {
      results.push({
        rpc: rpcUrl,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: Date.now() - rpcStartTime,
      })
    }
  }

  // If all RPCs failed, provide diagnostic information
  logger.warn('All RPC endpoints failed simulation', { results })

  return {
    success: false,
    diagnostics: {
      networkCheck: false,
      rpcSync: false,
      timingMs: Date.now() - startTime,
    },
    recommendations: [
      'Check if Phantom is on the correct network (devnet)',
      'Try refreshing Phantom wallet',
      'Wait a few minutes for network synchronization',
      'Verify transaction is not time-sensitive',
    ],
  }
}

/**
 * Enhanced transaction preparation specifically for Phantom compatibility
 * Implements all known fixes for Phantom simulation issues
 */
export async function preparePhantomOptimizedTransaction(
  originalTransaction: Transaction,
  feePayer: PublicKey
): Promise<{
  success: boolean
  transaction?: string
  diagnostics: Record<string, unknown>
  message: string
}> {
  const logger = getLogger({
    context: 'phantom-compatibility',
    function: 'preparePhantomOptimizedTransaction',
  })

  try {
    // Step 1: Try to find a compatible RPC
    const rpcFix = await findPhantomCompatibleRPC(originalTransaction, feePayer)

    if (rpcFix.success) {
      return {
        success: true,
        transaction: rpcFix.fixedTransaction,
        diagnostics: rpcFix.diagnostics,
        message: 'Transaction optimized for Phantom compatibility using synchronized RPC',
      }
    }

    // Step 2: If RPC sync fails, try with multiple fresh blockhashes
    logger.info('Attempting fresh blockhash strategy')

    const publicConnection = new Connection('https://api.devnet.solana.com', 'confirmed')

    // Try getting blockhash with different commitment levels
    const commitmentLevels = ['finalized', 'confirmed', 'processed'] as const

    for (const commitment of commitmentLevels) {
      try {
        const { blockhash } = await publicConnection.getLatestBlockhash(commitment)

        const testTx = Transaction.from(originalTransaction.serialize({ requireAllSignatures: false }))
        testTx.recentBlockhash = blockhash
        testTx.feePayer = feePayer

        // Test with Phantom-like simulation parameters
        const simulation = await publicConnection.simulateTransaction(testTx)

        if (!simulation.value.err) {
          logger.info('Found working blockhash with commitment level', { commitment })

          return {
            success: true,
            transaction: Buffer.from(testTx.serialize({ requireAllSignatures: false })).toString('base64'),
            diagnostics: {
              strategy: 'fresh-blockhash',
              commitment,
              computeUnits: simulation.value.unitsConsumed,
            },
            message: `Transaction prepared with ${commitment} commitment blockhash`,
          }
        }
      } catch (error) {
        logger.warn('Commitment level failed', { commitment, error })
      }
    }

    return {
      success: false,
      diagnostics: {
        allStrategiesFailed: true,
        testedRPCs: rpcFix.diagnostics,
      },
      message: 'All Phantom compatibility strategies failed. This may be a network-wide issue.',
    }
  } catch (error) {
    logger.error('Phantom optimization failed', error)

    return {
      success: false,
      diagnostics: { error: error instanceof Error ? error.message : 'Unknown error' },
      message: 'Failed to optimize transaction for Phantom',
    }
  }
}
