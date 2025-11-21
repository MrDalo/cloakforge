import { Connection } from '@solana/web3.js'
import { TokenAuditResult } from './types'
import { checkSecurity } from './checkSecurity'
import { checkHolders } from './checkHolders'
import { checkLiquidity } from './checkLiquidity'

export async function auditToken(connection: Connection, tokenAddress: string): Promise<TokenAuditResult> {
  // Run checks in parallel
  const [security, holders, liquidity] = await Promise.all([
    checkSecurity(connection, tokenAddress),
    checkHolders(connection, tokenAddress),
    checkLiquidity(connection, tokenAddress),
  ])

  // Calculate Trust Score
  let trustScore = 100

  // Apply penalties
  security.risks.forEach((risk) => {
    trustScore -= risk.scorePenalty
  })

  holders.risks.forEach((risk) => {
    trustScore -= risk.scorePenalty
  })

  liquidity.risks.forEach((risk) => {
    trustScore -= risk.scorePenalty
  })

  // Clamp score
  trustScore = Math.max(0, Math.min(100, trustScore))

  return {
    tokenAddress,
    trustScore,
    security,
    holders,
    liquidity,
    timestamp: Date.now(),
  }
}
