'use client'
import { useGetBalanceQuery } from '@/hooks/queries/useGetBalanceQuery'
import { PublicKey } from '@solana/web3.js'
import PrivacySection from '../PrivacySection'
import { WalletData } from '../types'
import HeroSection from '../HeroSection'
import QuickStatsSection from '../QuickStatsSection'
import BasicWalletInfo from '../BasicWalletInfo/BasicWalletInfo'
import LoadingWalletData from '../LoadingWalletData'
import ErrorWalletData from '../ErrorWalletData'
import { toast } from 'sonner'

interface ConnectedAccountContentProps {
  publicKey: PublicKey
}

const ConnectedAccountContent: React.FC<ConnectedAccountContentProps> = ({ publicKey }) => {
  // Fetch only balance data - no staking, no tokens, no transactions
  const balanceQuery = useGetBalanceQuery({
    address: publicKey,
  })

  // Loading state
  const isLoading = balanceQuery.isLoading
  if (isLoading) {
    return (
      <LoadingWalletData isBalanceQueryLoading={balanceQuery.isLoading} isTokensQueryLoading={false} isTransactionsQueryLoading={false} />
    )
  }

  // Error state
  const hasError = balanceQuery.isError
  if (hasError) {
    return (
      <ErrorWalletData
        onRetry={() => {
          balanceQuery.refetch()
        }}
      />
    )
  }

  // Success state - show only basic wallet information
  const handleConnect = (): void => {
    // Not needed here since wallet is already connected
  }

  // Create minimal wallet data with only balance information
  const solBalance = balanceQuery.data ? balanceQuery.data.balance / 1e9 : 0
  const solPrice = balanceQuery.data?.solanaPrice || 0
  const solValue = solBalance * solPrice

  const walletData: WalletData = {
    address: publicKey.toBase58(),
    solBalance,
    totalValue: solValue,
    transactionCount: 0, // Not fetching to reduce RPC load
    splTokens: [], // Not fetching to reduce RPC load
    recentTransactions: [], // Not fetching to reduce RPC load
    nftCount: 0, // Not fetching to reduce RPC load
    stakingRewards: 0, // No staking data
    stakingData: {
      totalStaked: 0,
      totalRewards: 0,
      activeStakeAccounts: 0,
      inactiveStakeAccounts: 0,
      stakeAccounts: [],
    },
  }

  const handleRefresh = async (): Promise<void> => {
    try {
      await balanceQuery.refetch()
      toast.success('Balance refreshed successfully', {
        description: 'Your wallet balance and SOL price have been updated.',
      })
    } catch (error) {
      toast.error('Failed to refresh balance', {
        description: 'Please try again in a few moments.',
      })
    }
  }

  return (
    <div className='from-background via-muted/30 to-background min-h-screen bg-gradient-to-br'>
      <HeroSection isConnected onConnect={handleConnect} walletData={walletData} />
      <QuickStatsSection walletData={walletData} />
      <BasicWalletInfo onRefresh={handleRefresh} walletData={walletData} />
      <PrivacySection />
    </div>
  )
}

export default ConnectedAccountContent
