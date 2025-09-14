import { cache } from 'react'
import axios from 'axios'
import { getLogger } from '@/lib/logger/logger'
import 'server-only'
import getServerConfig from '../../config/getServerConfig'

// Server-side cache for Solana price (shared across all requests)
const solanaPriceCache = new Map<string, { price: number; timestamp: number; source: string }>()

// Configuration
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes in milliseconds
const CACHE_KEY = 'solana-price'

interface AlchemyTokenPrice {
  symbol: string
  prices: Array<{
    currency: string
    value: string
    lastUpdatedAt: string
  }>
  error: string | null
}

// Server-side cached Solana price fetching
async function getSolanaPriceFromCache(): Promise<number> {
  const logger = getLogger({
    context: 'solana',
    component: 'priceCache',
  })

  const cached = solanaPriceCache.get('solana-price')
  const now = Date.now()

  // Return cached data if still valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.price
  }

  // Fetch fresh data from external APIs
  try {
    const config = getServerConfig()
    let price = 0

    // Try Alchemy Prices API first (if API key is configured)
    if (config.alchemyApiKey) {
      try {
        const fetchURL = `https://api.g.alchemy.com/prices/v1/${config.alchemyApiKey}/tokens/by-symbol`
        const params = new URLSearchParams()
        params.append('symbols', 'SOL')

        const response = await axios.get(`${fetchURL}?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        })

        // Find SOL in the response data
        const solanaData = response.data.data.find((token: AlchemyTokenPrice) => token.symbol === 'SOL')

        if (solanaData && solanaData.prices && solanaData.prices.length > 0 && !solanaData.error) {
          price = parseFloat(solanaData.prices[0].value)
        }
      } catch (alchemyError) {
        logger.error('Alchemy Prices API failed, falling back to CoinGecko', alchemyError)
      }
    }

    // Fallback to CoinGecko API if Alchemy failed or no API key
    if (price === 0) {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
          timeout: 10000,
        })

        price = response.data.solana.usd
      } catch (coinGeckoError) {
        logger.error(`CoinGecko API also failed: `, coinGeckoError)
      }
    }

    // Cache the results if we got a valid price
    if (price > 0) {
      const source = config.alchemyApiKey ? 'alchemy' : 'coingecko'
      solanaPriceCache.set('solana-price', {
        price,
        timestamp: now,
        source,
      })
    } else {
      // If we couldn't fetch a new price, return cached data if available (even if expired)
      if (cached) {
        return cached.price
      }
      logger.error('All APIs failed and no cached data available, returning 0')
    }

    return price
  } catch (error) {
    logger.error('Failed to fetch Solana price from cache', error, {
      cacheSize: solanaPriceCache.size,
      operation: 'getSolanaPriceFromCache',
    })

    // Return cached data if available, even if expired
    if (cached) {
      return cached.price
    }

    return 0
  }
}

// React cache wrapper for request-level deduplication
const getCachedSolanaPrice = cache(getSolanaPriceFromCache)

/**
 * Get information about the current cache state
 */
export const getSolanaPriceCacheInfo = (): {
  hasCache: boolean
  cacheAge: number
  price: number
  source: string
  lastFetch: string
  cacheExpiry: string
} => {
  const cached = solanaPriceCache.get(CACHE_KEY)

  if (!cached) {
    return {
      hasCache: false,
      cacheAge: 0,
      price: 0,
      source: '',
      lastFetch: '',
      cacheExpiry: '',
    }
  }

  const now = Date.now()
  const cacheAge = now - cached.timestamp
  const cacheExpiry = new Date(cached.timestamp + CACHE_DURATION).toISOString()

  return {
    hasCache: true,
    cacheAge,
    price: cached.price,
    source: cached.source,
    lastFetch: new Date(cached.timestamp).toISOString(),
    cacheExpiry,
  }
}

/**
 * Clear the price cache
 */
export const clearSolanaPriceCache = (): void => {
  solanaPriceCache.delete(CACHE_KEY)
}

// Export the main function
export { getCachedSolanaPrice }
