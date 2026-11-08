'use client'
import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { ActionButtons, ErrorDisplay, NavigationSection } from '@/components/pages/NotFoundPage'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import AdminTransactionsTable from '@/components/pages/Admin/AdminTransactionsTable'
import { checkAdminWallet } from './actions'

const AdminPage = (): React.ReactNode => {
  const { publicKey, connecting } = useWallet()
  const walletAddress = publicKey?.toBase58() ?? null

  // UI gate only: the server checks the wallet against its admin allowlist (the
  // allowlist itself never reaches the client). The admin API re-verifies every request.
  const { data: isAdminWallet = false, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ['admin-wallet-check', walletAddress],
    queryFn: () => checkAdminWallet(walletAddress ?? ''),
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
  })

  const isWalletConnected = !!publicKey

  // Show loading spinner while wallet is connecting or the admin check is running
  if (connecting || isCheckingAdmin) {
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
          Welcome to the CloakForge admin dashboard. Monitor platform service fees and transaction activity.
        </p>
      </div>

      <AdminTransactionsTable />
    </div>
  )
}

export default AdminPage
