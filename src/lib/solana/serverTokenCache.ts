import { cache } from 'react'
import { type TokenData } from '@/components/pages/TokenAuditorPage/tokenAuditorData'
import { getLogger } from '../logger/logger'
import 'server-only'

interface CacheEntry {
  data: TokenData
  timestamp: number
  accessCount: number
}

// Server-side persistent cache (shared across all requests and users)
const serverTokenCache = new Map<string, CacheEntry>()

// Configuration
const CACHE_DURATION = 30 * 1000 // 30 seconds in milliseconds
const MAX_CACHE_SIZE = 200 // Maximum number of cached tokens (larger for server)

// Server-side cache with time-based revalidation
async function getTokenDataFromServerCache(tokenAddress: string): Promise<TokenData | null> {
  // Check if we have cached data
  const cached = serverTokenCache.get(tokenAddress)
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    // Update access count for LRU eviction
    cached.accessCount += 1
    return cached.data
  }

  // If no cache or expired, fetch new data
  try {
    const tokenData = await fetchTokenDataFromBlockchain(tokenAddress)

    // Check cache size and evict if necessary
    if (serverTokenCache.size >= MAX_CACHE_SIZE) {
      evictLeastRecentlyUsed()
    }

    // Store in cache
    const newEntry: CacheEntry = {
      data: tokenData,
      timestamp: now,
      accessCount: 1,
    }

    serverTokenCache.set(tokenAddress, newEntry)

    // Optional: Clean up old cache entries
    cleanupExpiredEntries()

    return tokenData
  } catch (error) {
    const logger = getLogger({
      context: 'server-cache',
      component: 'tokenCache',
    })

    logger.error('Failed to fetch token data from blockchain', error, {
      tokenAddress,
      cacheSize: serverTokenCache.size,
      operation: 'fetchTokenDataFromBlockchain',
    })
    return null
  }
}

// React cache wrapper for request-level deduplication
const getTokenDataFromCache = cache(getTokenDataFromServerCache)

// Clean up expired cache entries to prevent memory leaks
function cleanupExpiredEntries(): void {
  const now = Date.now()

  for (const [key, value] of serverTokenCache.entries()) {
    if (now - value.timestamp >= CACHE_DURATION) {
      serverTokenCache.delete(key)
    }
  }
}

// Evict least recently used entries when cache is full
function evictLeastRecentlyUsed(): void {
  let lruKey = ''
  let lruAccessCount = Infinity

  for (const [key, value] of serverTokenCache.entries()) {
    if (value.accessCount < lruAccessCount) {
      lruAccessCount = value.accessCount
      lruKey = key
    }
  }

  if (lruKey) {
    serverTokenCache.delete(lruKey)
  }
}

// Your actual blockchain fetching logic
async function fetchTokenDataFromBlockchain(tokenAddress: string): Promise<TokenData> {
  // Simulate network delay (remove this in production)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // This is where you'd implement your actual Solana RPC calls
  // Example implementation:

  // 1. Fetch token metadata from token registry
  // 2. Get token account info from Solana RPC
  // 3. Calculate security score based on authority status
  // 4. Fetch price data from Jupiter/Coingecko
  // 5. Get holder distribution data

  // For now, returning mock data with the actual address
  const tokenData: TokenData = {
    address: tokenAddress,
    name: 'Sample Token',
    symbol: 'SAMPLE',
    decimals: 9,
    supply: '1,000,000',
    price: 0.001,
    marketCap: 1000,
    volume24h: 5000,
    priceChange24h: 2.5,
    holders: 1500,
    mintAuthority: tokenAddress.includes('USDC') ? '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' : null,
    freezeAuthority: null,
    metadata: {
      description: `Token analysis for ${tokenAddress}`,
      image: '',
      website: '',
      twitter: '',
    },
    security: {
      score: 75,
      risks: tokenAddress.includes('USDC') ? ['Centralized mint authority'] : [],
      flags: [],
    },
    liquidity: {
      pools: 5,
      totalLiquidity: 50000,
      largestPool: 'Raydium SAMPLE/SOL',
    },
    distribution: {
      top10Percentage: 35.0,
      concentrationRisk: 'Medium',
    },
  }

  return tokenData
}

// Utility functions for cache management
export const clearServerTokenCache = (): void => {
  const previousSize = serverTokenCache.size
  try {
    serverTokenCache.clear()
  } catch (error) {
    const logger = getLogger({
      context: 'server-cache',
      component: 'tokenCache',
    })

    logger.error('Failed to clear server token cache', error, {
      previousSize,
      operation: 'clearServerTokenCache',
    })
  }
}

export const getServerCacheStats = (): { size: number; maxSize: number; entries: string[] } => ({
  size: serverTokenCache.size,
  maxSize: MAX_CACHE_SIZE,
  entries: Array.from(serverTokenCache.keys()),
})

// Public API for server components
export const getServerCachedTokenData = getTokenDataFromCache
