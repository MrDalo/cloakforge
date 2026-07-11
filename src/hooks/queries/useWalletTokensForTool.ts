/**
 * Optimized Wallet Tokens Hook for Tools
 *
 * Smart hook that leverages server-side RPC calls and client-side caching
 * to minimize API calls while providing tool-specific token filtering.
 * Uses the new /api/solana/wallet-tokens endpoint with private RPC.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { getLogger } from '@/lib/logger/logger'
import type { ApiResponseBase } from '@/types'
import type { WalletTokensRequest, WalletTokensResponse } from '@/app/api/solana/wallet-tokens/route'
import type { ServerTokenWithMetadata } from '@/lib/solana/server-side/getWalletTokensServer'
import { type ToolType } from '@/types/toolTypes'

// Re-export types for convenience
export type { ServerTokenWithMetadata as TokenWithAuthorities } from '@/lib/solana/server-side/getWalletTokensServer'
export type { ToolType } from '@/types/toolTypes'

export interface UseWalletTokensForToolOptions {
  /** Enable query when wallet is not connected (will return empty result) */
  enabled?: boolean
  /** Include images in metadata (slower) */
  includeImages?: boolean
  /** Commitment level for RPC calls */
  commitment?: 'finalized' | 'confirmed' | 'processed'
  /** Refetch interval in milliseconds */
  refetchInterval?: number | false
}

/**
 * Smart client for wallet tokens API
 */
async function fetchWalletTokensForTool(
  walletAddress: string,
  toolType: ToolType,
  options: {
    includeImages?: boolean
    commitment?: 'finalized' | 'confirmed' | 'processed'
  } = {}
): Promise<ServerTokenWithMetadata[]> {
  const { includeImages = false, commitment = 'confirmed' } = options

  const logger = getLogger({
    context: 'wallet-tokens-client',
    function: 'fetchWalletTokensForTool',
    walletAddress,
    toolType,
  })

  const requestBody: WalletTokensRequest = {
    walletAddress,
    toolType,
    nonZeroOnly: true,
    includeToken2022: true,
    includeImages,
    commitment,
  }

  try {
    const response = await fetch('/api/solana/wallet-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error_message || `HTTP ${response.status}`)
    }

    const data: ApiResponseBase<WalletTokensResponse> = await response.json()

    if (data.status !== 'success' || !data.data) {
      throw new Error(data.error_message || 'Failed to fetch wallet tokens')
    }

    return data.data.tokens.tokens
  } catch (error) {
    logger.error('Failed to fetch wallet tokens from server', error, {
      walletAddress,
      toolType,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

/**
 * Main optimized hook for tool-specific wallet tokens
 *
 * Benefits of this approach:
 * 1. Server-side RPC calls using private endpoint
 * 2. Tool-specific filtering on server to reduce data transfer
 * 3. Smart caching with TanStack Query
 * 4. Automatic authority fetching when needed
 * 5. Optimized for minimal API calls
 */
export function useWalletTokensForTool(
  toolType: ToolType,
  options: UseWalletTokensForToolOptions = {}
): UseQueryResult<ServerTokenWithMetadata[], Error> {
  const { enabled = true, includeImages = false, commitment = 'confirmed', refetchInterval = false } = options
  const { connected, publicKey } = useWallet()

  return useQuery<ServerTokenWithMetadata[], Error>({
    queryKey: [
      'walletTokensForTool',
      publicKey?.toString(),
      toolType,
      {
        includeImages,
        commitment,
      },
    ],
    queryFn: async (): Promise<ServerTokenWithMetadata[]> => {
      if (!connected || !publicKey) {
        return []
      }

      return fetchWalletTokensForTool(publicKey.toString(), toolType, {
        includeImages,
        commitment,
      })
    },
    enabled: enabled && connected && !!publicKey,
    staleTime: Infinity,
    // staleTime: getStaleTimeForTool(toolType),
    gcTime: 300000, // 5 minutes cache
    refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Convenience hooks for specific tool types with optimal defaults

/**
 * Hook for Burn Token tool
 * Returns tokens owned by wallet with non-zero balance
 */
export const useWalletTokensForBurnTool = (options?: UseWalletTokensForToolOptions): UseQueryResult<ServerTokenWithMetadata[], Error> =>
  useWalletTokensForTool('burn-tokens', options)

/**
 * Hook for Liquidity Provider tool
 * Returns tokens owned by wallet with non-zero balance
 */
export const useWalletTokensForLiquidityProvider = (
  options?: UseWalletTokensForToolOptions
): UseQueryResult<ServerTokenWithMetadata[], Error> => useWalletTokensForTool('liquidity-provider', options)

/**
 * Hook for Transaction Multisender tool
 * Returns tokens owned by wallet with non-zero balance
 */
export const useWalletTokensForTransactionMultisender = (
  options?: UseWalletTokensForToolOptions
): UseQueryResult<ServerTokenWithMetadata[], Error> => useWalletTokensForTool('transaction-multisender', options)

/**
 * Hook for Revoke Mint Authority tool
 * Returns tokens where wallet has mint authority
 */
export const useWalletTokensForRevokeMintAuthority = (
  options?: UseWalletTokensForToolOptions
): UseQueryResult<ServerTokenWithMetadata[], Error> => useWalletTokensForTool('revoke-mint-authority', options)

/**
 * Hook for Revoke Freeze Authority tool
 * Returns tokens where wallet has freeze authority
 */
export const useWalletTokensForRevokeFreezeAuthority = (
  options?: UseWalletTokensForToolOptions
): UseQueryResult<ServerTokenWithMetadata[], Error> => useWalletTokensForTool('revoke-freeze-authority', options)

/**
 * Hook for Freeze Wallets tool
 * Returns tokens where wallet has freeze authority
 */
export const useWalletTokensForFreezeWallets = (
  options?: UseWalletTokensForToolOptions
): UseQueryResult<ServerTokenWithMetadata[], Error> => useWalletTokensForTool('freeze-wallets', options)

/**
 * Hook for Unfreeze Wallets tool
 * Returns tokens where wallet has freeze authority
 */
export const useWalletTokensForUnfreezeWallets = (
  options?: UseWalletTokensForToolOptions
): UseQueryResult<ServerTokenWithMetadata[], Error> => useWalletTokensForTool('unfreeze-wallets', options)

/**
 * Hook for getting all wallet tokens without tool-specific filtering
 * Useful for dashboards or general token displays
 */
export const useWalletTokensForAll = (options?: UseWalletTokensForToolOptions): UseQueryResult<ServerTokenWithMetadata[], Error> =>
  useWalletTokensForTool('all', options)

/**
 * Query key factories for wallet tokens
 */
export const walletTokensQueryKeys = {
  all: ['walletTokensForTool'] as const,
  wallet: (walletAddress?: string) => ['walletTokensForTool', walletAddress] as const,
  tool: (walletAddress?: string, toolType?: ToolType) => ['walletTokensForTool', walletAddress, toolType] as const,
  toolWithOptions: (walletAddress?: string, toolType?: ToolType, options?: Record<string, unknown>) =>
    ['walletTokensForTool', walletAddress, toolType, options] as const,
}
