'use client'

import { AlertTriangle } from 'lucide-react'

export const DataCollectionNote = (): React.ReactNode => (
  <div className='bg-info/35 border-info mt-8 rounded-lg border p-4'>
    <div className='flex items-start space-x-3'>
      <AlertTriangle className='text-info-foreground mt-0.5 h-5 w-5 shrink-0' />
      <div className='text-muted-foreground text-sm' suppressHydrationWarning>
        <strong>Note:</strong> The minimal data we collect (wallet addresses and transaction data) is already publicly available on the
        Solana blockchain. We do not add any additional tracking.
      </div>
    </div>
  </div>
)
