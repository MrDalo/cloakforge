import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LiquidityAnalysis } from '@/lib/solana/token-auditor/types'
import { Droplets } from 'lucide-react'

interface LiquidityCardProps {
  analysis: LiquidityAnalysis
}

export const LiquidityCard = ({ analysis }: LiquidityCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center gap-2'>
        <Droplets className='h-5 w-5' />
        Liquidity Analysis
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className='bg-muted rounded-lg p-4 text-center'>
        <p className='text-muted-foreground mb-2 text-sm'>Liquidity Status</p>
        <p className='text-lg font-semibold'>{analysis.status}</p>
        {analysis.risks.map((risk, i) => (
          <p className='mt-2 text-xs text-yellow-600' key={i}>
            {risk.description}
          </p>
        ))}
      </div>
    </CardContent>
  </Card>
)
