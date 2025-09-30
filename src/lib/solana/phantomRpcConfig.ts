/**
 * Phantom Wallet RPC Compatibility
 *
 * Provides RPC endpoints that are more aligned with what Phantom wallet uses
 * to reduce simulation discrepancies between server and client.
 */

/**
 * Get RPC endpoint that's compatible with Phantom wallet simulation
 * This uses public endpoints that are more likely to be in sync with Phantom's state
 */
export function getPhantomCompatibleRPC(): string {
  // Use Helius public endpoints which are commonly used by wallets
  if (process.env.NEXT_PUBLIC_NETWORK === 'mainnet-beta') {
    return 'https://api.mainnet-beta.solana.com'
  }

  // For devnet, use a mix of reliable public endpoints
  return 'https://api.devnet.solana.com'
}

/**
 * Get alternative RPC endpoints for fallback
 * These are other public endpoints that Phantom might use
 */
export function getAlternativeRPCs(): string[] {
  if (process.env.NEXT_PUBLIC_NETWORK === 'mainnet-beta') {
    return ['https://api.mainnet-beta.solana.com', 'https://solana-api.projectserum.com']
  }

  return ['https://api.devnet.solana.com', 'https://devnet.genesysgo.net']
}

/**
 * Configuration for Phantom-compatible operations
 */
export const PHANTOM_COMPATIBLE_CONFIG = {
  // Use more conservative settings that align with wallet expectations
  commitment: 'confirmed' as const,
  skipPreflight: false,
  maxRetries: 3,

  // Simulation parameters that match common wallet settings
  simulationConfig: {
    includeAccounts: true,
    commitment: 'confirmed' as const,
  },
}
