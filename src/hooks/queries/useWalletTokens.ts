/**
 * TanStack Query hooks for wallet tokens with metadata
 *
 * Provides cached, optimized fetching of wallet tokens with metadata.
 * Integrates getWalletTokens and getTokensMetadata for efficient batching.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { getWalletTokens, type WalletTokensResult } from '@/lib/solana/getWalletTokens'
import { getTokensMetadata, type TokenMetadataWithBalance } from '@/lib/solana/getTokenMetadata'
import { getLogger } from '@/lib/logger/logger'

// Re-export types for convenience
export type { TokenMetadataWithBalance } from '@/lib/solana/getTokenMetadata'

export interface WalletTokensWithMetadata {
  tokens: TokenMetadataWithBalance[]
  totalAccounts: number
  nonZeroOnly: boolean
  /** Timestamp when data was fetched */
  fetchedAt: number
}

export interface UseWalletTokensWithMetadataOptions {
  /** Include only tokens with non-zero balances */
  nonZeroOnly?: boolean
  /** Include Token-2022 program tokens */
  includeToken2022?: boolean
  /** Include image fetching from metadata URIs */
  includeImages?: boolean
  /** Commitment level for the query */
  commitment?: 'finalized' | 'confirmed' | 'processed'
  /** Refetch interval in milliseconds (default: 30 seconds) */
  refetchInterval?: number
  /** Enable query when wallet is not connected (will return empty result) */
  enabled?: boolean
}

/**
 * Hook to fetch wallet tokens with metadata using TanStack Query
 */
export function useWalletTokensWithMetadata(
  options: UseWalletTokensWithMetadataOptions = {}
): UseQueryResult<WalletTokensWithMetadata, Error> {
  const {
    nonZeroOnly = true,
    includeToken2022 = true,
    includeImages = true,
    commitment = 'confirmed',
    refetchInterval = false,
    enabled = true,
  } = options

  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()

  const logger = getLogger({
    context: 'wallet-tokens-query',
    function: 'useWalletTokensWithMetadata',
  })

  const queryResult = useQuery<WalletTokensWithMetadata, Error>({
    queryKey: [
      'walletTokensWithMetadata',
      publicKey?.toString(),
      {
        nonZeroOnly,
        includeToken2022,
        includeImages,
        commitment,
      },
    ],
    queryFn: async (): Promise<WalletTokensWithMetadata> => {
      if (!connected || !publicKey) {
        return {
          tokens: [],
          totalAccounts: 0,
          nonZeroOnly,
          fetchedAt: Date.now(),
        }
      }

      try {
        // Step 1: Fetch wallet token accounts
        const walletTokensResult = await getWalletTokens(publicKey, connection, {
          nonZeroOnly,
          includeToken2022,
          commitment,
        })

        // Step 2: Fetch metadata for all tokens
        const tokensWithMetadata = await getTokensMetadata(walletTokensResult.tokens, connection, {
          includeImages,
          commitment,
        })

        const result: WalletTokensWithMetadata = {
          tokens: tokensWithMetadata,
          totalAccounts: walletTokensResult.totalAccounts,
          nonZeroOnly: walletTokensResult.nonZeroOnly,
          fetchedAt: Date.now(),
        }

        return result
      } catch (error) {
        logger.error('Failed to fetch wallet tokens with metadata', error, {
          wallet: publicKey.toString(),
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    enabled: enabled && connected && !!publicKey,
    staleTime: 30000, // 30 seconds - good balance
    gcTime: 600000, // 10 minutes - longer cache for better UX
    refetchInterval, // 1 minute - less frequent background updates
    refetchOnWindowFocus: true, // Keep this for fresh data when user returns
    refetchOnReconnect: true, // Essential for network recovery
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  return queryResult
}

/**
 * Hook to fetch wallet tokens (without metadata) for simpler use cases
 */
export function useWalletTokens(
  options: {
    nonZeroOnly?: boolean
    includeToken2022?: boolean
    commitment?: 'finalized' | 'confirmed' | 'processed'
    refetchInterval?: number
    enabled?: boolean
  } = {}
): UseQueryResult<WalletTokensResult, Error> {
  const { nonZeroOnly = true, includeToken2022 = true, commitment = 'confirmed', refetchInterval = false, enabled = true } = options

  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()

  return useQuery<WalletTokensResult, Error>({
    queryKey: [
      'walletTokens',
      publicKey?.toString(),
      {
        nonZeroOnly,
        includeToken2022,
        commitment,
      },
    ],
    queryFn: async (): Promise<WalletTokensResult> => {
      if (!connected || !publicKey) {
        return {
          tokens: [],
          totalAccounts: 0,
          nonZeroOnly,
        }
      }

      return getWalletTokens(publicKey, connection, {
        nonZeroOnly,
        includeToken2022,
        commitment,
      })
    },
    enabled: enabled && connected && !!publicKey,
    staleTime: 30000, // 30 seconds - good balance
    gcTime: 600000, // 10 minutes - longer cache for better UX
    refetchInterval,
    refetchOnWindowFocus: true, // Keep this for fresh data when user returns
    refetchOnReconnect: true, // Essential for network recovery
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Query key factory for wallet tokens
 */
export const walletTokensQueryKeys = {
  all: ['walletTokens'] as const,
  wallet: (walletAddress?: string) => ['walletTokens', walletAddress] as const,
  walletWithOptions: (walletAddress?: string, options?: Record<string, unknown>) => ['walletTokens', walletAddress, options] as const,
  withMetadata: (walletAddress?: string, options?: Record<string, unknown>) =>
    ['walletTokensWithMetadata', walletAddress, options] as const,
}
