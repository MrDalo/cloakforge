/**
 * Solana RPC Utilities
 *
 * Functions for RPC connection management and health checks.
 */

import { createSolanaRpc } from '@solana/kit'
import { Connection } from '@solana/web3.js'
import getConfig from '@/lib/config/getConfig'

/**
 * Check if RPC endpoint is responding
 *
 * @param rpcPublicEndpoint - Optional RPC endpoint (defaults to config)
 * @returns True if RPC is healthy
 */
export const isRpcHealthy = async (rpcPublicEndpoint?: string): Promise<boolean> => {
  try {
    const endpoint = rpcPublicEndpoint || getConfig().rpcPublicEndpoint
    const rpc = createSolanaRpc(endpoint)
    await rpc.getLatestBlockhash().send()
    return true
  } catch {
    return false
  }
}

/**
 * Get cluster info from RPC endpoint
 *
 * @returns Cluster name and version info
 */
export const getClusterInfo = async (): Promise<{ cluster: string; version?: string }> => {
  const { rpcPublicEndpoint } = getConfig()

  if (rpcPublicEndpoint.includes('devnet')) {
    return { cluster: 'devnet' }
  } else if (rpcPublicEndpoint.includes('testnet')) {
    return { cluster: 'testnet' }
  } else if (rpcPublicEndpoint.includes('mainnet')) {
    return { cluster: 'mainnet-beta' }
  } else {
    return { cluster: 'custom' }
  }
}

/**
 * Create Kit RPC connection helper
 *
 * @param endpoint - Optional RPC endpoint (defaults to config)
 * @returns Kit RPC instance
 */
export const createKitRpc = (endpoint?: string): ReturnType<typeof createSolanaRpc> => {
  const rpcPublicEndpoint = endpoint || getConfig().rpcPublicEndpoint
  return createSolanaRpc(rpcPublicEndpoint)
}

/**
 * Create reusable connection pair for consistent RPC operations
 * Prevents connection multiplicity and rate limiting issues
 *
 * @param endpoint - Optional RPC endpoint (defaults to config)
 * @returns Kit RPC and legacy connection pair
 */
export const createConnectionPair = (
  endpoint?: string
): {
  kitRpc: ReturnType<typeof createSolanaRpc>
  legacyConnection: Connection
} => {
  const rpcPublicEndpoint = endpoint || getConfig().rpcPublicEndpoint
  return {
    kitRpc: createSolanaRpc(rpcPublicEndpoint),
    legacyConnection: new Connection(rpcPublicEndpoint, 'confirmed'),
  }
}
