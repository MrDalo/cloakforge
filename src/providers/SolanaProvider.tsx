/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger'
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust'
import { ReactNode, useCallback, useMemo, useEffect } from 'react'
import { getLogger } from '@/lib/logger/logger'
import { toast } from 'sonner'
import { useConfig } from '@/hooks/context/useConfig'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@solana/wallet-adapter-react-ui/styles.css')

// Inner component that has access to wallet context
const WalletErrorHandler = ({ children }: { children: ReactNode }): React.ReactNode => {
  const { wallet, disconnect } = useWallet()

  useEffect(() => {
    // Listen for wallet errors and reset wallet selection if needed
    const handleWalletError = (): void => {
      if (wallet) {
        // Force disconnect to reset wallet state
        disconnect().catch(() => {
          // Ignore disconnect errors
        })
      }
    }

    // Custom event listener for wallet errors
    window.addEventListener('wallet-error', handleWalletError)

    return (): void => {
      window.removeEventListener('wallet-error', handleWalletError)
    }
  }, [wallet, disconnect])

  return <>{children}</>
}

export const SolanaProvider = ({ children }: { children: ReactNode }): React.ReactNode => {
  const logger = useMemo(
    () =>
      getLogger({
        file: 'SolanaProvider.tsx',
      }),
    []
  )

  const network = WalletAdapterNetwork.Mainnet
  const { rpcPublicEndpoint } = useConfig()

  const onError = useCallback((error: WalletError) => {
    if (error.message === 'User rejected the request.') {
      toast.error('Failed to connect your wallet. Process of connecting was cancelled.')
    } else {
      toast.error('Failed to connect your wallet. Please try again.')
    }

    logger.error('Wallet connection error:', error, {
      walletError: error.name,
      userAgent: navigator.userAgent,
      action: 'walletConnect',
    })

    localStorage.removeItem('walletName') // Remove stored wallet context

    // Dispatch custom event to trigger wallet reset
    window.dispatchEvent(new CustomEvent('wallet-error', { detail: error }))
  }, [])

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new LedgerWalletAdapter(), new SolflareWalletAdapter(), new TrustWalletAdapter()],
    [network]
  )

  return (
    <ConnectionProvider endpoint={rpcPublicEndpoint}>
      <WalletProvider autoConnect={true} onError={onError} wallets={wallets}>
        <WalletModalProvider>
          <WalletErrorHandler>{children}</WalletErrorHandler>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
