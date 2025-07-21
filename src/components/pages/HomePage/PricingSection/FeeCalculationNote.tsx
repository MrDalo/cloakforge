'use client'

import { Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const FeeCalculationNote = (): React.ReactNode => (
  <Card className='border-info bg-info/15 border-2'>
    <CardContent className='p-6'>
      <div className='flex items-start space-x-4'>
        <Info className='text-info mt-0.5 h-6 w-6 flex-shrink-0' />
        <div>
          <h4 className='mb-2 font-medium'>How Fees Are Calculated</h4>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            <strong>Total Cost = Platform Fee + Network Fee</strong>
            <br />
            Platform fees are fixed and help us maintain the service. Network fees vary based on Solana network congestion and are paid
            directly to validators. We display estimated network fees, but actual costs may vary slightly.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)
