import { cacheLife, cacheTag } from 'next/cache'
import { Connection } from '@solana/web3.js'
import { type TokenData } from '@/components/pages/TokenAuditorPage/tokenAuditorData'
import { auditToken } from '@/lib/solana/token-auditor/auditToken'
import getServerConfig from '@/lib/config/getServerConfig'
import { getLogger } from '../../logger/logger'
import 'server-only'

const cacheLogger = getLogger({
  context: 'server-cache',
  component: 'tokenCache',
})

/**
 * Get cached token data with 30-second cache duration
 *
 * Uses Next.js 16 Cache Components for real-time blockchain data:
 * - Cached for 30 seconds (blockchain data changes frequently)
 * - Cache key includes token address for per-token caching
 * - Stale-while-revalidate: users get cached data instantly
 *
 * @param tokenAddress - Solana token address
 * @returns Cached token data or null if fetch fails
 */
export async function getCachedTokenData(tokenAddress: string): Promise<TokenData | null> {
  'use cache'
  cacheLife('seconds') // 30 seconds - blockchain data updates frequently
  cacheTag('token-data') // For on-demand revalidation

  // Fetch token data from blockchain
  try {
    const tokenData = await fetchTokenDataFromBlockchain(tokenAddress)
    return tokenData
  } catch (error) {
    cacheLogger.error('Failed to fetch token data from blockchain', error, {
      tokenAddress,
      operation: 'getCachedTokenData',
    })

    // Next.js serves stale data automatically on error
    return null
  }
}

// Blockchain fetching logic
async function fetchTokenDataFromBlockchain(tokenAddress: string): Promise<TokenData> {
  const serverConfig = getServerConfig()
  const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')

  const auditResult = await auditToken(connection, tokenAddress)

  // Map AuditResult to TokenData
  const tokenData: TokenData = {
    address: tokenAddress,
    name: auditResult.security.name,
    symbol: auditResult.security.symbol,
    decimals: auditResult.security.decimals,
    supply: auditResult.security.supply,
    price: 0, // TODO: Fetch price from Jupiter/Coingecko
    marketCap: 0, // TODO: Calculate market cap
    volume24h: 0, // TODO: Fetch volume
    priceChange24h: 0, // TODO: Fetch price change
    holders: auditResult.holders.totalHolders || 0,
    mintAuthority: auditResult.security.mintAuthority,
    freezeAuthority: auditResult.security.freezeAuthority,
    metadata: {
      description: `Token analysis for ${auditResult.security.name} (${auditResult.security.symbol})`,
      image: auditResult.security.image,
      website: '',
      twitter: '',
    },
    security: {
      score: auditResult.trustScore,
      risks: auditResult.security.risks.map((r) => r.label),
      flags: auditResult.security.isMutable ? ['Mutable Metadata'] : [],
    },
    liquidity: {
      pools: auditResult.liquidity.poolAddress ? 1 : 0,
      totalLiquidity: 0, // TODO: Calculate liquidity value
      largestPool: auditResult.liquidity.poolAddress ? 'Raydium V4' : 'None',
    },
    distribution: {
      top10Percentage: auditResult.holders.top10Percentage,
      concentrationRisk: auditResult.holders.top10Percentage > 50 ? 'High' : auditResult.holders.top10Percentage > 20 ? 'Medium' : 'Low',
    },
  }

  return tokenData
}
