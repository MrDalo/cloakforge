import { Suspense } from 'react'
import {
  TokenDashboard,
  TokenAuditorHeader,
  TokenAuditorError,
  TokenAuditorLoading,
  auditFailureMessages,
} from '@/components/pages/TokenAuditorPage'
import { getTokenAudit } from '@/lib/solana/server-side/serverTokenCache'
import type { TokenAuditResult } from '@/types/tokenAudit'

interface TokenAuditorPageProps {
  params: Promise<{ tokenAddress: string }>
}

/** Longest part of the (untrusted) URL segment echoed back on the error card. */
const MAX_DISPLAYED_ADDRESS_LENGTH = 64

const TokenAuditorPage = async ({ params }: TokenAuditorPageProps): Promise<React.ReactNode> => {
  const { tokenAddress } = await params

  // Validates the address, then reads the mint on-chain via the private RPC (cached briefly)
  const result = await getTokenAudit(tokenAddress).catch((): TokenAuditResult => ({ status: 'unavailable' }))

  if (result.status !== 'ok') {
    return (
      <TokenAuditorError error={auditFailureMessages[result.status]} tokenAddress={tokenAddress.slice(0, MAX_DISPLAYED_ADDRESS_LENGTH)} />
    )
  }

  return (
    <div className='bg-background min-h-screen'>
      <TokenAuditorHeader />
      <TokenDashboard report={result.report} />
    </div>
  )
}

const TokenAuditorPageWithSuspense = ({ params }: TokenAuditorPageProps): React.ReactNode => (
  <Suspense fallback={<TokenAuditorLoading />}>
    <TokenAuditorPage params={params} />
  </Suspense>
)

export default TokenAuditorPageWithSuspense
