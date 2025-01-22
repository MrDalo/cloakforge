'use client'

import OverviewCard from '@/components/account-page/overview-card'
import TransactionTable from '@/components/account-page/transaction-table'
import LoadingSpinner from '@/components/core/loading-spinner'
import WalletConnectionButton from '@/components/ui/wallet-connection-button/wallet-connection-button'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'

const AccountPage = (): React.ReactNode => {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(true) // Track loading state

  // Simulate wallet loading
  useEffect(() => {
    setIsLoading(false) // Wallet is loaded
  }, [])

  if (isLoading) {
    // Render a loading spinner or placeholder while initializing
    return (
      <div className='flex size-full flex-col items-center justify-center'>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className='flex h-auto w-full flex-col items-start justify-start gap-4 overflow-hidden'>
      <h1 className='w-full text-center text-[3rem] font-semibold text-black'>
        Account info
      </h1>
      {publicKey ? (
        <div className='flex w-full flex-1 flex-col items-center justify-start gap-4 px-10 pb-[10vh] pt-[4vh]'>
          <OverviewCard publicKey={publicKey} />
          <TransactionTable publicKey={publicKey} />
        </div>
      ) : (
        <div className='flex w-full flex-1 flex-col items-center justify-start gap-2 pt-[10vh]'>
          <h2 className='text-[1.3rem] font-medium'>
            Connect your wallet to view account info
          </h2>
          <WalletConnectionButton />
        </div>
      )}
    </div>
  )
}

export default AccountPage
