import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface TrustScoreCardProps {
  score: number
  loading?: boolean
}

export const TrustScoreCard = ({ score, loading }: TrustScoreCardProps) => {
  let colorClass = 'bg-red-500'
  let textClass = 'text-red-500'
  let label = 'Critical Risk'

  if (score >= 80) {
    colorClass = 'bg-green-500'
    textClass = 'text-green-500'
    label = 'Safe'
  } else if (score >= 50) {
    colorClass = 'bg-yellow-500'
    textClass = 'text-yellow-500'
    label = 'Caution'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trust Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='bg-muted h-32 animate-pulse rounded-md' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Score</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col items-center justify-center space-y-4'>
        <div className='border-muted relative flex h-32 w-32 items-center justify-center rounded-full border-4'>
          <div
            className={cn('absolute inset-0 -rotate-45 rounded-full border-4 border-transparent border-t-current', textClass)}
            style={{
              transform: `rotate(${score * 3.6 - 90}deg)`, // Simple rotation logic
              transition: 'transform 1s ease-out',
            }}
          />
          <span className={cn('text-4xl font-bold', textClass)}>{score}</span>
        </div>
        <div className='text-center'>
          <h3 className={cn('text-xl font-semibold', textClass)}>{label}</h3>
          <p className='text-muted-foreground text-sm'>Based on automated analysis of on-chain data.</p>
        </div>
        <Progress className={cn('h-2 w-full', colorClass)} value={score} />
      </CardContent>
    </Card>
  )
}
