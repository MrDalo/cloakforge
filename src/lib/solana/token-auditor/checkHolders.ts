import { Connection, PublicKey } from '@solana/web3.js'
import { HolderAnalysis, Risk } from './types'
import { getLogger } from '@/lib/logger/logger'

export async function checkHolders(connection: Connection, mintAddress: string): Promise<HolderAnalysis> {
  const logger = getLogger({ context: 'token-auditor', action: 'checkHolders' })
  const mintPubkey = new PublicKey(mintAddress)
  const risks: Risk[] = []

  try {
    // 1. Fetch Largest Accounts
    const largestAccounts = await connection.getTokenLargestAccounts(mintPubkey)
    const supplyInfo = await connection.getTokenSupply(mintPubkey)

    const totalSupply = supplyInfo.value.uiAmount || 0
    if (totalSupply === 0) {
      return {
        totalHolders: 0,
        top10Percentage: 0,
        topHolders: [],
        risks: [],
      }
    }

    // 2. Calculate Top 10 Percentage
    const top10 = largestAccounts.value.slice(0, 10)
    const top10Total = top10.reduce((acc, accInfo) => acc + (accInfo.uiAmount || 0), 0)
    const top10Percentage = (top10Total / totalSupply) * 100

    // 3. Analyze Risks
    if (top10Percentage > 50) {
      risks.push({
        level: 'HIGH',
        label: 'High Holder Concentration',
        description: `Top 10 holders own ${top10Percentage.toFixed(1)}% of the supply. High risk of price manipulation.`,
        scorePenalty: 40,
      })
    } else if (top10Percentage > 20) {
      risks.push({
        level: 'MEDIUM',
        label: 'Medium Holder Concentration',
        description: `Top 10 holders own ${top10Percentage.toFixed(1)}% of the supply.`,
        scorePenalty: 10,
      })
    }

    return {
      totalHolders: null,
      top10Percentage,
      topHolders: top10.map((h) => ({
        address: h.address.toString(),
        amount: h.uiAmount || 0,
        percentage: ((h.uiAmount || 0) / totalSupply) * 100,
      })),
      risks,
    }
  } catch (error) {
    logger.error('Failed to check holders', error)
    return {
      totalHolders: null,
      top10Percentage: 0,
      topHolders: [],
      risks: [],
    }
  }
}
