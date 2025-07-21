'use client'

import { AlertCircle } from 'lucide-react'
import { NotificationCard } from '@/components/common'

export const NetworkFeeNote = (): React.ReactNode => (
  <NotificationCard
    description={
      <>
        Network fees are determined by the Solana blockchain and can fluctuate based on network activity. During high congestion, fees may
        be higher. We recommend checking current network conditions before large operations.
        <br />
        <strong>Failed transactions may still incur network fees, but platform fees are only charged on successful operations.</strong>
      </>
    }
    icon={AlertCircle}
    title='About Network Fees'
    variant='warning'
  />
)
