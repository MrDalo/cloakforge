import { cacheLife, cacheTag } from 'next/cache'
import axios from 'axios'
import { getLogger } from '@/lib/logger/logger'
import 'server-only'
import getServerConfig from '../../config/getServerConfig'

interface AlchemyTokenPrice {
  symbol: string
  prices: Array<{
    currency: string
    value: string
    lastUpdatedAt: string
  }>
  error: string | null
}

/**
 * Get cached Solana price with 2-minute cache duration
 *
 * Uses Next.js 16 Cache Components with dual API fallback:
 * - Primary: Alchemy Prices API (if API key configured)
 * - Fallback: CoinGecko API
 * - Cached for 2 minutes (price changes frequently)
 * - Stale-while-revalidate: users get cached price instantly
 *
 * @returns Cached Solana price in USD, or 0 if all APIs fail
 */
export async function getCachedSolanaPrice(): Promise<number> {
  'use cache'
  cacheLife('minutes') // 2 minutes - price data updates frequently
  cacheTag('solana-price') // For on-demand revalidation

  const logger = getLogger({
    context: 'solana',
    component: 'priceCache',
  })

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
        logger.error('CoinGecko API also failed', coinGeckoError)
      }
    }

    // If both APIs failed, Next.js will serve stale cached data automatically
    // If no stale data, return 0
    if (price === 0) {
      logger.error('All APIs failed, returning 0')
    }

    return price
  } catch (error) {
    logger.error('Failed to fetch Solana price', error, {
      operation: 'getCachedSolanaPrice',
    })

    // Next.js serves stale data automatically on error
    return 0
  }
}
