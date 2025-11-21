'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TokenAuditorForm } from './TokenAuditorForm'
import { getLogger } from '@/lib/logger/logger'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export { TokenDashboard } from './TokenDashboard'
export { TokenAuditorHeader } from './TokenAuditorHeader'
export { TokenAuditorError } from './TokenAuditorError'
export { TokenAuditorLoading } from './TokenAuditorLoading'

const TokenAuditorPage = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logger = getLogger({ context: 'TokenAuditorPage' })

  const handleAudit = async (values: { tokenAddress: string }) => {
    setLoading(true)
    setError(null)

    try {
      logger.info('Navigating to audit page', { tokenAddress: values.tokenAddress })
      router.push(`/tools/token-auditor/${values.tokenAddress}`)
    } catch (err) {
      logger.error('Navigation failed', err)
      setError('Failed to navigate to audit page.')
      setLoading(false)
    }
  }

  return (
    <div className='container mx-auto max-w-4xl space-y-8 py-8'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold'>Token Auditor</h1>
        <p className='text-muted-foreground'>Analyze any Solana token for security risks, holder distribution, and liquidity status.</p>
      </div>

      <TokenAuditorForm isLoading={loading} onSubmit={handleAudit} />

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default TokenAuditorPage
