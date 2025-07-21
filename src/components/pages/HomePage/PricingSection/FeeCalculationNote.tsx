'use client'

import { Info } from 'lucide-react'
import { NotificationCard } from '@/components/common'

export const FeeCalculationNote = (): React.ReactNode => (
  <NotificationCard
    description={
      <>
        <strong>Total Cost = Platform Fee + Network Fee</strong>
        <br />
        Platform fees are fixed and help us maintain the service. Network fees vary based on Solana network congestion and are paid directly
        to validators. We display estimated network fees, but actual costs may vary slightly.
      </>
    }
    icon={Info}
    title='How Fees Are Calculated'
    variant='info'
  />
)
