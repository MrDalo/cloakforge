'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, RefreshCw } from 'lucide-react'

interface EmptyTokensStateProps {
  onRefresh: () => void
}

export const EmptyTokensState = ({ onRefresh }: EmptyTokensStateProps): React.ReactNode => (
  <Card>
    <CardContent className='flex items-center justify-center py-8'>
      <div className='text-center'>
        <Shield className='text-muted-foreground mx-auto h-12 w-12' />
        <h3 className='mt-4 text-lg font-medium'>No Tokens Found</h3>
        <p className='text-muted-foreground mt-2 text-sm'>Your wallet doesn&apos;t contain any tokens with mint authority.</p>
        <Button className='mt-4' onClick={onRefresh} size='sm' type='button' variant='outline'>
          <RefreshCw className='mr-2 h-4 w-4' />
          Refresh
        </Button>
      </div>
    </CardContent>
  </Card>
)
