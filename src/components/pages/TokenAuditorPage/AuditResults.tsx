import { TokenAuditResult } from '@/lib/solana/token-auditor/types'
import { TrustScoreCard } from './TrustScoreCard'
import { SecurityCard } from './SecurityCard'
import { HoldersCard } from './HoldersCard'
import { LiquidityCard } from './LiquidityCard'

interface AuditResultsProps {
  result: TokenAuditResult
}

export const AuditResults = ({ result }: AuditResultsProps) => (
  <div className='space-y-6'>
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <TrustScoreCard score={result.trustScore} />
      <SecurityCard analysis={result.security} />
    </div>
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <HoldersCard analysis={result.holders} />
      <LiquidityCard analysis={result.liquidity} />
    </div>
  </div>
)
