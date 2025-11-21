import { Connection, PublicKey } from '@solana/web3.js'
import { LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk'
import { LiquidityAnalysis, Risk } from './types'
import { getLogger } from '@/lib/logger/logger'

const RAYDIUM_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')

export async function checkLiquidity(connection: Connection, mintAddress: string): Promise<LiquidityAnalysis> {
  const logger = getLogger({ context: 'token-auditor', action: 'checkLiquidity' })
  const mintPubkey = new PublicKey(mintAddress)

  try {
    // 1. Find Raydium Pool (V4)
    // We search for accounts where baseMint == mint OR quoteMint == mint
    // Optimization: We only check for pairs with WSOL or USDC usually, but to be thorough we check both sides.
    // However, getProgramAccounts with memcmp is efficient.

    const sizeFilter = { dataSize: LIQUIDITY_STATE_LAYOUT_V4.span }
    const baseMintFilter = {
      memcmp: {
        offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('baseMint'),
        bytes: mintPubkey.toBase58(),
      },
    }
    const quoteMintFilter = {
      memcmp: {
        offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
        bytes: mintPubkey.toBase58(),
      },
    }

    // Run both queries in parallel
    const [baseAccounts, quoteAccounts] = await Promise.all([
      connection.getProgramAccounts(RAYDIUM_PROGRAM_ID, { filters: [sizeFilter, baseMintFilter] }),
      connection.getProgramAccounts(RAYDIUM_PROGRAM_ID, { filters: [sizeFilter, quoteMintFilter] }),
    ])

    const allAccounts = [...baseAccounts, ...quoteAccounts]

    if (allAccounts.length === 0) {
      return {
        status: 'UNKNOWN',
        poolAddress: null,
        lpMint: null,
        lpBurnedPercentage: 0,
        lpLockedPercentage: 0,
        creatorBalance: 0,
        risks: [
          {
            level: 'HIGH',
            label: 'No Liquidity Found',
            description: 'Could not find a Raydium V4 pool for this token.',
            scorePenalty: 50,
          },
        ],
      }
    }

    // Use the first pool found (usually the main one)
    // Ideally we'd sort by liquidity depth, but that requires parsing reserves.
    // For now, we take the first one.
    const poolAccount = allAccounts[0]
    const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(poolAccount.account.data)
    const lpMint = poolState.lpMint
    const poolAddress = poolAccount.pubkey.toString()

    // 2. Check LP Token Supply and Holders
    const lpMintInfo = await connection.getTokenSupply(lpMint)
    const lpTotalSupply = lpMintInfo.value.uiAmount || 0

    if (lpTotalSupply === 0) {
      // Should not happen for active pool
      return {
        status: 'UNKNOWN',
        poolAddress,
        lpMint: lpMint.toString(),
        lpBurnedPercentage: 0,
        lpLockedPercentage: 0,
        creatorBalance: 0,
        risks: [],
      }
    }

    const lpHolders = await connection.getTokenLargestAccounts(lpMint)
    let burnedAmount = 0
    const lockedAmount = 0 // Placeholder for known lockers

    // Known burn addresses
    const BURN_ADDRESSES = ['11111111111111111111111111111111', 'Dead111111111111111111111111111111111111111']

    for (const holder of lpHolders.value) {
      if (BURN_ADDRESSES.includes(holder.address.toString())) {
        burnedAmount += holder.uiAmount || 0
      }
      // Add checks for known lockers here if we had their addresses
    }

    const burnedPercentage = (burnedAmount / lpTotalSupply) * 100
    const risks: Risk[] = []

    let status: 'LOCKED' | 'BURNED' | 'UNLOCKED' | 'UNKNOWN' = 'UNLOCKED'

    if (burnedPercentage > 95) {
      status = 'BURNED'
    } else if (burnedPercentage > 0) {
      // Partial burn
    } else {
      // Check for high concentration in a single wallet (potential rug)
      const topHolder = lpHolders.value[0]
      if (topHolder && (topHolder.uiAmount || 0) / lpTotalSupply > 0.5) {
        risks.push({
          level: 'CRITICAL',
          label: 'Liquidity Not Burned',
          description: `Top holder owns ${(((topHolder.uiAmount || 0) / lpTotalSupply) * 100).toFixed(1)}% of LP tokens.`,
          scorePenalty: 80,
        })
      }
    }

    return {
      status,
      poolAddress,
      lpMint: lpMint.toString(),
      lpBurnedPercentage: burnedPercentage,
      lpLockedPercentage: lockedAmount, // Placeholder
      creatorBalance: 0, // Hard to track without indexing
      risks,
    }
  } catch (error) {
    logger.error('Failed to check liquidity', error)
    return {
      status: 'UNKNOWN',
      poolAddress: null,
      lpMint: null,
      lpBurnedPercentage: 0,
      lpLockedPercentage: 0,
      creatorBalance: 0,
      risks: [
        {
          level: 'MEDIUM',
          label: 'Liquidity Check Failed',
          description: 'Failed to fetch Raydium pool data.',
          scorePenalty: 0,
        },
      ],
    }
  }
}
