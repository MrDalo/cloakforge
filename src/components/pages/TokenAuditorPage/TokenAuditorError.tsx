'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface TokenAuditorErrorProps {
  error: string
  tokenAddress: string
}

export const TokenAuditorError = ({ error, tokenAddress }: TokenAuditorErrorProps): React.ReactNode => {
  const router = useRouter()

  const handleRefresh = (): void => {
    router.refresh()
  }

  const handleBack = (): void => {
    router.push('/tools/token-auditor')
  }

  const refreshIcon = <RefreshCw className='mr-2 h-4 w-4' />
  const backIcon = <ArrowLeft className='mr-2 h-4 w-4' />

  const errorCard = (
    <Card className='border-destructive w-full max-w-md border-2'>
      <CardContent className='flex flex-col items-center space-y-6 p-8 text-center'>
        <div className='bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full'>
          <AlertCircle className='text-destructive h-8 w-8' />
        </div>

        <div>
          <h2 className='mb-2 text-xl font-semibold'>Analysis Failed</h2>
          <p className='text-muted-foreground text-sm'>{error}</p>
        </div>

        <div className='text-muted-foreground bg-muted/50 rounded-lg p-3'>
          <p className='text-xs'>Token Address:</p>
          <p className='font-mono text-sm'>{tokenAddress}</p>
        </div>

        <div className='flex space-x-3'>
          <Button onClick={handleRefresh} variant='outline'>
            {refreshIcon}
            Retry
          </Button>
          <Button onClick={handleBack}>
            {backIcon}
            Back to Auditor
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className='bg-background flex min-h-screen items-center justify-center px-6'>
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.6 }}>
        {errorCard}
      </motion.div>
    </div>
  )
}
