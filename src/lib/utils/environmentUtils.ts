/**
 * Determine the Solana environment based on RPC endpoint
 */
export function getSolanaEnvironment(rpcEndpoint: string): {
  name: 'Mainnet' | 'Devnet' | 'Testnet' | 'Unknown'
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  description: string
} {
  const url = rpcEndpoint.toLowerCase()

  if (url.includes('devnet')) {
    return {
      name: 'Devnet',
      variant: 'secondary',
      description: 'Development network for testing',
    }
  }

  if (url.includes('testnet')) {
    return {
      name: 'Testnet',
      variant: 'outline',
      description: 'Test network for final validation',
    }
  }

  if (url.includes('mainnet') || url.includes('api.mainnet-beta.solana.com')) {
    return {
      name: 'Mainnet',
      variant: 'default',
      description: 'Production network with real SOL',
    }
  }

  return {
    name: 'Unknown',
    variant: 'destructive',
    description: 'Unknown network configuration',
  }
}
