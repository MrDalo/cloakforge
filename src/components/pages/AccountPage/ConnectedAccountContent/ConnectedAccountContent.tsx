'use client'
import { useGetBalanceQuery } from '@/hooks/queries/useGetBalanceQuery'
import { useGetTransactionsQuery } from '@/hooks/queries/useGetSignaturesQuery'
import { useGetTokenAccountsQuery } from '@/hooks/queries/useGetTokenAccountsQuery'
import { useGetStakingRewardsQuery } from '@/hooks/queries/useGetStakingRewardsQuery'
import { PublicKey } from '@solana/web3.js'
import PrivacySection from '../PrivacySection'
import { WalletData } from '../types'
import { transformSolanaDataToWalletData } from '@/lib/solana/dataTransformers'
import HeroSection from '../HeroSection'
import QuickStatsSection from '../QuickStatsSection'
import MainContentTabs from '../MainContentTabs'
import LoadingWalletData from '../LoadingWalletData'
import ErrorWalletData from '../ErrorWalletData'
import { toast } from 'sonner'

interface ConnectedAccountContentProps {
  publicKey: PublicKey
  transactionPage: number
  tokenPage: number
  onTransactionPageChange: (page: number) => void
  onTokenPageChange: (page: number) => void
}

const ConnectedAccountContent: React.FC<ConnectedAccountContentProps> = ({
  publicKey,
  transactionPage,
  tokenPage,
  onTransactionPageChange,
  onTokenPageChange,
}) => {
  // Fetch data only when we have publicKey
  const balanceQuery = useGetBalanceQuery({
    address: publicKey,
  })

  const tokensQuery = useGetTokenAccountsQuery({
    walletaddress: publicKey,
  })

  const transactionsQuery = useGetTransactionsQuery({
    address: publicKey,
    page: transactionPage,
  })

  const stakingQuery = useGetStakingRewardsQuery({
    walletAddress: publicKey,
  })

  // Loading state - use similar layout as not connected
  const isLoading = balanceQuery.isLoading || tokensQuery.isLoading || transactionsQuery.isLoading || stakingQuery.isLoading
  if (isLoading) {
    return (
      <LoadingWalletData
        isBalanceQueryLoading={balanceQuery.isLoading}
        isTokensQueryLoading={tokensQuery.isLoading}
        isTransactionsQueryLoading={transactionsQuery.isLoading}
      />
    )
  }

  // Error state - use similar layout
  const hasError = balanceQuery.isError || tokensQuery.isError || transactionsQuery.isError || stakingQuery.isError
  if (hasError) {
    return (
      <ErrorWalletData
        onRetry={() => {
          balanceQuery.refetch()
          tokensQuery.refetch()
          transactionsQuery.refetch()
          stakingQuery.refetch()
        }}
      />
    )
  }

  // Success state - show the full account interface
  const handleConnect = (): void => {
    // Not needed here since wallet is already connected
  }

  // Transform real Solana data to WalletData format
  const walletData: WalletData = transformSolanaDataToWalletData({
    publicKey,
    balanceData: balanceQuery.data,
    tokensData: tokensQuery.data,
    transactionsData: transactionsQuery.data,
    stakingData: stakingQuery.data,
  })

  const handleRefresh = (): void => {
    balanceQuery.refetch()
    tokensQuery.refetch()
    transactionsQuery.refetch()
    stakingQuery.refetch()
    toast.success('Data refreshed successfully', {
      description: 'Your account data has been updated.',
    })
  }

  return (
    <div className='from-background via-muted/30 to-background min-h-screen bg-gradient-to-br'>
      <HeroSection isConnected onConnect={handleConnect} walletData={walletData} />
      <QuickStatsSection walletData={walletData} />
      <MainContentTabs
        onRefresh={handleRefresh}
        onTokenPageChange={onTokenPageChange}
        onTransactionPageChange={onTransactionPageChange}
        tokenPage={tokenPage}
        transactionPage={transactionPage}
        transactionsData={transactionsQuery.data}
        walletData={walletData}
      />
      <PrivacySection />
    </div>
  )
}

export default ConnectedAccountContent
