import { Coins, Calculator, InfoIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import InfoTooltip from '@/components/common/InfoTooltip'

const transactionFee = 0.000005
const networkFee = 0.00001

export const FeeBreakdown = (): React.ReactNode => (
  <Card className='bg-secondary/5 border-secondary/20'>
    <CardHeader>
      <CardTitle className='flex items-center space-x-2 text-lg'>
        <Calculator className='text-secondary h-5 w-5' />
        <span>Transaction Fees</span>
        <Badge className='text-secondary border-secondary/50' variant='outline'>
          LOW COST
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className='space-y-4'>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Coins className='text-secondary h-4 w-4' />
            <span className='text-sm'>Transaction Fee</span>
            <InfoTooltip info_description='Base fee for submitting the transaction to the Solana network' />
          </div>
          <span className='font-mono text-sm'>{transactionFee} SOL</span>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Coins className='text-secondary h-4 w-4' />
            <span className='text-sm'>Network Fee</span>
            <InfoTooltip info_description='Additional network processing fee for the authority revocation' />
          </div>
          <span className='font-mono text-sm'>{networkFee} SOL</span>
        </div>

        <div className='border-secondary/20 border-t pt-3'>
          <div className='flex items-center justify-between font-medium'>
            <span>Total Cost</span>
            <span className='text-secondary font-mono'>{(transactionFee + networkFee).toFixed(6)} SOL</span>
          </div>
        </div>
      </div>

      <div className='p-3'>
        <div className='flex items-start space-x-2'>
          <InfoIcon className='text-secondary mt-0.5 h-4 w-4 flex-shrink-0' />
          <div className='text-muted-foreground text-xs'>
            <p className='text-secondary mb-1 font-medium'>Fee Information</p>
            <p>
              These are estimated fees based on current network conditions. Actual fees may vary slightly depending on network congestion at
              the time of transaction.
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)
