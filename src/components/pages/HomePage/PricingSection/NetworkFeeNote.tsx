'use client'

import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const NetworkFeeNote = (): React.ReactNode => (
  <Card className='border-warning bg-warning/15 border-2'>
    <CardContent className='p-6'>
      <div className='flex items-start space-x-4'>
        <AlertCircle className='text-warning-foreground mt-0.5 h-6 w-6 flex-shrink-0' />
        <div>
          <h4 className='mb-2 font-medium'>About Network Fees</h4>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Network fees are determined by the Solana blockchain and can fluctuate based on network activity. During high congestion, fees
            may be higher. We recommend checking current network conditions before large operations.
            <br />
            <strong>Failed transactions may still incur network fees, but platform fees are only charged on successful operations.</strong>
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)
