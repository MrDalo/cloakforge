import { Suspense } from 'react'
import { TokenDashboard, TokenAuditorHeader, TokenAuditorError, TokenAuditorLoading } from '@/components/pages/TokenAuditorPage'
import { getServerCachedTokenData } from '@/lib/solana/server-side/serverTokenCache'

interface TokenAuditorPageProps {
  params: Promise<{ tokenAddress: string }>
}

const TokenAuditorPage = async ({ params }: TokenAuditorPageProps): Promise<React.ReactNode> => {
  const { tokenAddress } = await params

  // Validate token address format (basic Solana address validation)
  const isValidAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(tokenAddress)

  if (!isValidAddress) {
    return (
      <TokenAuditorError error='Invalid token address format. Please enter a valid Solana token address.' tokenAddress={tokenAddress} />
    )
  }

  // Fetch token data on the server with caching
  try {
    const tokenData = await getServerCachedTokenData(tokenAddress)

    if (!tokenData) {
      return (
        <TokenAuditorError error='Failed to fetch token data. Please check the token address and try again.' tokenAddress={tokenAddress} />
      )
    }

    return (
      <div className='bg-background min-h-screen'>
        {/* Header with navigation */}
        <TokenAuditorHeader />

        {/* Token Dashboard - onReset is now optional and handled by header */}
        <TokenDashboard tokenData={tokenData} />
      </div>
    )
  } catch {
    return <TokenAuditorError error='An error occurred while fetching token data.' tokenAddress={tokenAddress} />
  }
}

// Wrap the page with Suspense for better loading states
const TokenAuditorPageWithSuspense = ({ params }: TokenAuditorPageProps): React.ReactNode => (
  <Suspense fallback={<TokenAuditorLoading tokenAddress='Loading...' />}>
    <TokenAuditorPage params={params} />
  </Suspense>
)

export default TokenAuditorPageWithSuspense
