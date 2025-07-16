'use client'

import LoadingSpinner from '@/components/common/LoadingSpinner'
import WalletConnectionButton from '@/components/common/WalletConnectionButton/WalletConnectionButton'
import OverviewCard from '@/components/pages/AccountPage/OverviewCard'
import TokenCard from '@/components/pages/AccountPage/TokenCard'
import TransactionTable from '@/components/pages/AccountPage/TransactionTable'
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
      <div className='flex w-full flex-1 flex-col items-center justify-start gap-4 overflow-hidden'>
        <h1 className='w-full pt-8 text-center text-[2rem] font-semibold text-black sm:pt-0 sm:text-[3rem]'>
          Account info
        </h1>

        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className='flex h-auto w-full flex-col items-start justify-start gap-4 overflow-hidden'>
      <h1 className='w-full pt-8 text-center text-[2rem] font-semibold text-black sm:pt-0 sm:text-[3rem]'>
        Account info
      </h1>
      {publicKey ? (
        <div className='flex w-full flex-1 flex-col items-center justify-start gap-4 px-2 pb-10 sm:pt-[4vh] lg:px-10'>
          <div className='grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:flex-row xl:grid-cols-3'>
            <OverviewCard publicKey={publicKey} />
            <TokenCard publicKey={publicKey} />
          </div>
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
