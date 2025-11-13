import { Suspense } from 'react'
import { TokenDashboard, TokenAuditorHeader, TokenAuditorError, TokenAuditorLoading } from '@/components/pages/TokenAuditorPage'
import { getCachedTokenData } from '@/lib/solana/server-side/serverTokenCache'
import { isValidSolanaAddress } from '@/lib/solana'

interface TokenAuditorPageProps {
  params: Promise<{ tokenAddress: string }>
}

const TokenAuditorPage = async ({ params }: TokenAuditorPageProps): Promise<React.ReactNode> => {
  const { tokenAddress } = await params

  // Validate token address format
  const isValidAddress = isValidSolanaAddress(tokenAddress)

  if (!isValidAddress) {
    return (
      <TokenAuditorError error='Invalid token address format. Please enter a valid Solana token address.' tokenAddress={tokenAddress} />
    )
  }

  // Fetch token data on the server with caching
  try {
    const tokenData = await getCachedTokenData(tokenAddress)

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
