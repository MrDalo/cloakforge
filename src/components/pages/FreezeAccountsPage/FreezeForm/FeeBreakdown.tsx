import { DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface FeeBreakdownProps {
  tokenAddress: string
  freezeMode: 'single' | 'batch'
  targetAccount?: string
  batchAccounts?: string
}

export const FeeBreakdown = ({ tokenAddress, freezeMode, batchAccounts }: FeeBreakdownProps): React.ReactNode => {
  const calculateFees = (): { baseFee: number; networkFee: number; total: number; accountCount: number } => {
    const baseFee = 0.005 // SOL
    const networkFee = 0.000005 // SOL per signature
    const accountCount = freezeMode === 'batch' ? batchAccounts?.split('\n').filter((line) => line.trim()).length || 0 : 1
    const totalNetworkFee = networkFee * accountCount

    return {
      baseFee,
      networkFee: totalNetworkFee,
      total: baseFee + totalNetworkFee,
      accountCount,
    }
  }

  const fees = calculateFees()

  if (!tokenAddress) return null

  return (
    <Card className='bg-muted/30 border-primary/20'>
      <CardContent className='p-6'>
        <div className='mb-4 flex items-center space-x-3'>
          <DollarSign className='text-primary h-5 w-5' />
          <h3 className='font-medium'>Transaction Fees</h3>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Platform Fee</span>
            <span className='font-medium'>{fees.baseFee} SOL</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>
              Network Fee ({fees.accountCount} account{fees.accountCount !== 1 ? 's' : ''})
            </span>
            <span className='font-medium'>{fees.networkFee.toFixed(6)} SOL</span>
          </div>
          <Separator />
          <div className='flex items-center justify-between text-lg'>
            <span className='font-medium'>Total Cost</span>
            <span className='text-primary font-medium'>{fees.total.toFixed(6)} SOL</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
