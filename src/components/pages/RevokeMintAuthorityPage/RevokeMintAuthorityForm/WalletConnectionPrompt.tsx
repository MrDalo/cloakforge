'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

export const WalletConnectionPrompt = (): React.ReactNode => (
  <Card>
    <CardContent className='flex items-center justify-center py-8'>
      <div className='text-center'>
        <Wallet className='text-muted-foreground mx-auto h-12 w-12' />
        <h3 className='mt-4 text-lg font-medium'>Connect Your Wallet</h3>
        <p className='text-muted-foreground mt-2 text-sm'>Connect your wallet to view tokens with mint authority.</p>
      </div>
    </CardContent>
  </Card>
)
