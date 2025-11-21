export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE'

export interface Risk {
  level: RiskLevel
  label: string
  description: string
  scorePenalty: number
}

export interface SecurityAnalysis {
  mintAuthority: string | null
  freezeAuthority: string | null
  isMutable: boolean
  isToken2022: boolean
  extensions: string[]
  transferFee: number
  risks: Risk[]
  // Basic Info
  name: string
  symbol: string
  decimals: number
  supply: string
  image: string
}

export interface HolderAnalysis {
  totalHolders: number | null // Null if exact count unavailable via simple RPC
  top10Percentage: number
  topHolders: {
    address: string
    amount: number
    percentage: number
  }[]
  risks: Risk[]
}

export interface LiquidityAnalysis {
  status: 'LOCKED' | 'BURNED' | 'UNLOCKED' | 'UNKNOWN'
  poolAddress: string | null
  lpMint: string | null
  lpBurnedPercentage: number
  lpLockedPercentage: number
  creatorBalance: number
  risks: Risk[]
}

export interface TokenAuditResult {
  tokenAddress: string
  trustScore: number
  security: SecurityAnalysis
  holders: HolderAnalysis
  liquidity: LiquidityAnalysis
  timestamp: number
}
