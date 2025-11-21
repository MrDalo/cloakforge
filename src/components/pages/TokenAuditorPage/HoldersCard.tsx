import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { HolderAnalysis } from '@/lib/solana/token-auditor/types'
import { Users } from 'lucide-react'

interface HoldersCardProps {
  analysis: HolderAnalysis
}

export const HoldersCard = ({ analysis }: HoldersCardProps) => {
  const isHighRisk = analysis.top10Percentage > 50
  const isMediumRisk = analysis.top10Percentage > 20

  let riskColor = 'bg-green-500'
  if (isHighRisk) riskColor = 'bg-red-500'
  else if (isMediumRisk) riskColor = 'bg-yellow-500'

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Users className='h-5 w-5' />
          Holder Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div>
          <div className='mb-2 flex justify-between'>
            <span className='text-sm font-medium'>Top 10 Holders Own</span>
            <span className='font-bold'>{analysis.top10Percentage.toFixed(2)}%</span>
          </div>
          <Progress className={riskColor} value={analysis.top10Percentage} />
          <p className='text-muted-foreground mt-2 text-xs'>
            {isHighRisk
              ? 'High concentration. Whales can manipulate price.'
              : isMediumRisk
                ? 'Moderate concentration.'
                : 'Healthy distribution.'}
          </p>
        </div>

        <div className='space-y-2'>
          <h4 className='text-sm font-semibold'>Top Holders</h4>
          <div className='space-y-1'>
            {analysis.topHolders.map((holder, i) => (
              <div className='bg-muted/50 flex justify-between rounded p-2 text-xs' key={i}>
                <span className='w-32 truncate font-mono'>{holder.address}</span>
                <span>{holder.percentage.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
