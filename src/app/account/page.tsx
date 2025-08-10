'use client'

import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, Loader2 } from 'lucide-react'
import WalletConnectionButton from '@/components/common/WalletConnectionButton/WalletConnectionButton'
import { HeroSection, QuickStatsSection, MainContentTabs, PrivacySection } from '@/components/pages/AccountPage2'
import { useGetBalanceQuery } from '@/hooks/queries/useGetBalanceQuery'
import { useGetTokenAccountsQuery } from '@/hooks/queries/useGetTokenAccountsQuery'
import { useGetTransactionsQuery } from '@/hooks/queries/useGetSignaturesQuery'
import type { WalletData } from '@/components/pages/AccountPage2/types'
import { transformSolanaDataToWalletData } from '@/lib/solana/dataTransformers'

const AccountPage: React.FC = () => {
  const { publicKey } = useWallet()
  const [page] = useState(1)

  // Not connected state - use same layout as HeroSection
  if (!publicKey) {
    return (
      <div className='bg-background relative flex min-h-screen items-center justify-center'>
        <Card className='mx-6 w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <Wallet className='text-muted-foreground mx-auto mb-6 h-16 w-16' />
            <h3 className='mb-4 text-xl font-medium'>Connect Your Wallet</h3>
            <p className='text-muted-foreground mb-6'>
              Connect your Solana wallet to view your account information and manage your assets.
            </p>
            <WalletConnectionButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Now that we have publicKey, we can render the connected component
  return <ConnectedAccountContent page={page} publicKey={publicKey} />
}

interface ConnectedAccountContentProps {
  publicKey: PublicKey
  page: number
}

const ConnectedAccountContent: React.FC<ConnectedAccountContentProps> = ({ publicKey, page }) => {
  // Fetch data only when we have publicKey
  const balanceQuery = useGetBalanceQuery({
    address: publicKey,
  })

  const tokensQuery = useGetTokenAccountsQuery({
    walletaddress: publicKey,
  })

  const transactionsQuery = useGetTransactionsQuery({
    address: publicKey,
    page,
  })

  // Loading state - use similar layout as not connected
  const isLoading = balanceQuery.isLoading || tokensQuery.isLoading || transactionsQuery.isLoading
  if (isLoading) {
    return (
      <div className='bg-background relative flex min-h-screen items-center justify-center'>
        <Card className='mx-6 w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <Loader2 className='text-muted-foreground mx-auto mb-6 h-16 w-16 animate-spin' />
            <h3 className='mb-4 text-xl font-medium'>Loading Your Wallet</h3>
            <p className='text-muted-foreground mb-6'>Fetching your account information and assets from the Solana blockchain.</p>
            <Button className='w-full' disabled>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading...
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state - use similar layout
  const hasError = balanceQuery.isError || tokensQuery.isError || transactionsQuery.isError
  if (hasError) {
    return (
      <div className='bg-background relative flex min-h-screen items-center justify-center'>
        <Card className='mx-6 w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <Wallet className='text-muted-foreground mx-auto mb-6 h-16 w-16' />
            <h3 className='mb-4 text-xl font-medium'>Error Loading Account</h3>
            <p className='text-muted-foreground mb-6'>There was an error loading your account data. Please try again.</p>
            <Button
              className='w-full'
              onClick={() => {
                balanceQuery.refetch()
                tokensQuery.refetch()
                transactionsQuery.refetch()
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
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
  })

  return (
    <div className='from-background via-muted/30 to-background min-h-screen bg-gradient-to-br'>
      <HeroSection isConnected onConnect={handleConnect} walletData={walletData} />
      <QuickStatsSection walletData={walletData} />
      <MainContentTabs walletData={walletData} />
      <PrivacySection />
    </div>
  )
}

export default AccountPage
