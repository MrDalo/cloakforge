'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const TokenAuditorHeader = (): React.ReactNode => {
  const router = useRouter()

  const handleBack = (): void => {
    router.push('/tools/token-auditor')
  }

  const handleRefresh = (): void => {
    router.refresh()
  }

  return (
    <div className='border-border border-b bg-white/50 backdrop-blur-sm'>
      <div className='container mx-auto flex items-center justify-between px-6 py-4'>
        <Button onClick={handleBack} size='sm' variant='ghost'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Token Auditor
        </Button>

        <Button onClick={handleRefresh} size='sm' variant='outline'>
          <RefreshCw className='mr-2 h-4 w-4' />
          Refresh Data
        </Button>
      </div>
    </div>
  )
}
