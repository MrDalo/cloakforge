'use client'
import React, { useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConfig } from '@/hooks/context/useConfig'
import { ActionButtons, ErrorDisplay, NavigationSection } from '@/components/pages/NotFoundPage'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import AdminTransactionsTable from '@/components/pages/Admin/AdminTransactionsTable'

const AdminPage = (): React.ReactNode => {
  const { publicKey, connecting } = useWallet()
  const config = useConfig()

  // Check if wallet is connected and if it's the admin wallet
  const isWalletConnected = useMemo(() => !!publicKey, [publicKey])
  const isAdminWallet = useMemo(
    () => !!publicKey && publicKey?.toString() === config.feeWalletAddress,
    [publicKey, config.feeWalletAddress]
  )

  // Show loading spinner while wallet is connecting
  if (connecting) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <LoadingSpinner />
      </div>
    )
  }

  // Show unauthorized access page if wallet is not connected or not admin wallet
  if (!isWalletConnected || !isAdminWallet) {
    return (
      <div className='bg-background relative min-h-screen'>
        {/* Main Content */}
        <section className='relative overflow-hidden px-6 py-16 md:py-24'>
          <div className='relative z-10 container mx-auto max-w-4xl'>
            <div className='text-center'>
              <ErrorDisplay />
              <ActionButtons />
            </div>
            <NavigationSection />
          </div>
        </section>
      </div>
    )
  }

  // Show admin dashboard for authorized admin wallet
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
        <p className='text-muted-foreground mt-2'>
          Welcome to the SolCloak admin dashboard. Monitor platform service fees and transaction activity.
        </p>
      </div>

      <AdminTransactionsTable />
    </div>
  )
}

export default AdminPage
