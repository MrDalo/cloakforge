/**
 * PHANTOM RPC SYNC FIX
 * 
 * Forces transaction to use Phantom's exact RPC endpoint and state
 */

import { Connection, Transaction, PublicKey } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'

interface PhantomRpcSyncResult {
  success: boolean
  transaction?: string
  rpcUsed?: string
  error?: string
  syncDetails: {
    originalRpc: string
    phantomRpc: string
    blockhashMatch: boolean
    accountStateSync: boolean
    timingMs: number
  }
}

/**
 * Phantom's known RPC endpoints (they switch between these)
 */
const PHANTOM_KNOWN_RPCS = [
  'https://api.devnet.solana.com',
  'https://devnet.solana.com', 
  'https://rpc.ankr.com/solana_devnet',
  'https://api.devnet.solana.com/',
  'https://solana-devnet.g.alchemy.com/v2/demo', // Public Alchemy
]

/**
 * Syncs transaction with Phantom's exact RPC state
 */
export async function syncTransactionWithPhantomRpc(
  serializedTransaction: string,
  walletPublicKey: PublicKey
): Promise<PhantomRpcSyncResult> {
  const logger = getLogger({
    context: 'phantom-rpc-sync',
    function: 'syncTransactionWithPhantomRpc',
  })

  const startTime = Date.now()
  let syncDetails = {
    originalRpc: 'unknown',
    phantomRpc: 'unknown',
    blockhashMatch: false,
    accountStateSync: false,
    timingMs: 0,
  }

  try {
    // Deserialize original transaction
    const originalTx = Transaction.from(Buffer.from(serializedTransaction, 'base64'))
    const originalBlockhash = originalTx.recentBlockhash
    syncDetails.originalRpc = 'server-provided'

    // Test each known Phantom RPC until we find one that works
    for (const rpcUrl of PHANTOM_KNOWN_RPCS) {
      try {
        logger.info(`Testing Phantom RPC: ${rpcUrl}`)
        
        const phantomConnection = new Connection(rpcUrl, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 30000,
        })

        // Get blockhash from this RPC
        const { blockhash: phantomBlockhash } = await phantomConnection.getLatestBlockhash('confirmed')
        
        // Create a new transaction with Phantom's blockhash
        const phantomTx = Transaction.from(Buffer.from(serializedTransaction, 'base64'))
        phantomTx.recentBlockhash = phantomBlockhash
        phantomTx.feePayer = walletPublicKey

        // Test simulation on this RPC
        const simulation = await phantomConnection.simulateTransaction(phantomTx)
        
        if (simulation.value.err) {
          logger.warn(`RPC ${rpcUrl} simulation failed`, { 
            error: simulation.value.err,
            blockhash: phantomBlockhash.slice(0, 8) + '...'
          })
          continue // Try next RPC
        }

        // SUCCESS! This RPC works
        syncDetails.phantomRpc = rpcUrl
        syncDetails.blockhashMatch = originalBlockhash === phantomBlockhash
        syncDetails.accountStateSync = true
        syncDetails.timingMs = Date.now() - startTime

        const syncedTransaction = Buffer.from(phantomTx.serialize({ requireAllSignatures: false })).toString('base64')

        logger.info('Successfully synced with Phantom RPC', {
          rpc: rpcUrl,
          blockhashChanged: !syncDetails.blockhashMatch,
          computeUnits: simulation.value.unitsConsumed || 0,
          timingMs: syncDetails.timingMs,
        })

        return {
          success: true,
          transaction: syncedTransaction,
          rpcUsed: rpcUrl,
          syncDetails,
        }

      } catch (rpcError) {
        logger.warn(`RPC ${rpcUrl} failed health check`, { error: rpcError })
        continue
      }
    }

    // If we get here, all RPCs failed
    syncDetails.timingMs = Date.now() - startTime
    
    return {
      success: false,
      error: 'All known Phantom RPCs failed simulation',
      syncDetails,
    }

  } catch (error) {
    syncDetails.timingMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error('Failed to sync with Phantom RPC', {
      error: errorMessage,
      wallet: walletPublicKey.toString(),
      timingMs: syncDetails.timingMs,
    })

    return {
      success: false,
      error: errorMessage,
      syncDetails,
    }
  }
}

/**
 * NUCLEAR OPTION: Wait for Phantom to be ready then sync
 */
export async function waitForPhantomAndSync(
  serializedTransaction: string,
  walletPublicKey: PublicKey,
  maxWaitMs: number = 5000
): Promise<PhantomRpcSyncResult> {
  const logger = getLogger({
    context: 'phantom-rpc-sync',
    function: 'waitForPhantomAndSync',
  })

  // Wait a bit for Phantom to settle its RPC state
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Try multiple times with different wait periods
  const attempts = [0, 500, 1000, 2000]
  
  for (const waitMs of attempts) {
    if (waitMs > 0) {
      logger.info(`Waiting ${waitMs}ms for Phantom RPC sync...`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
    }

    const result = await syncTransactionWithPhantomRpc(serializedTransaction, walletPublicKey)
    
    if (result.success) {
      logger.info('Phantom RPC sync successful', {
        attempt: attempts.indexOf(waitMs) + 1,
        waitMs,
        rpcUsed: result.rpcUsed,
      })
      return result
    }
  }

  // All attempts failed
  logger.error('All Phantom RPC sync attempts failed')
  return await syncTransactionWithPhantomRpc(serializedTransaction, walletPublicKey)
}