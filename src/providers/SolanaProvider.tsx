'use client'

import { type WalletError } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger'
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust'
import { type ReactNode, useEffect } from 'react'
import { getLogger } from '@/lib/logger/logger'
import { toast } from 'sonner'
import { useConfig } from '@/hooks/context/useConfig'

const logger = getLogger({ file: 'SolanaProvider.tsx' })

const wallets = [new PhantomWalletAdapter(), new LedgerWalletAdapter(), new SolflareWalletAdapter(), new TrustWalletAdapter()]

/**
 * Handles wallet-adapter errors and emits a disconnect event for connection failures.
 *
 * @param error - Wallet adapter error payload.
 */
const onError = (error: WalletError): void => {
  // Only handle actual wallet CONNECTION errors, not transaction signing errors
  const isConnectionError = error.name === 'WalletConnectionError'

  if (isConnectionError) {
    if (error.message === 'User rejected the request.') {
      toast.error('Failed to connect your wallet. Process of connecting was cancelled.')
    } else {
      toast.error('Failed to connect your wallet. Please try again.')
    }

    logger.error('Wallet connection error:', error, {
      walletError: error.name,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      action: 'walletConnect',
    })

    localStorage.removeItem('walletName')
    window.dispatchEvent(new CustomEvent('wallet-error', { detail: error }))
  } else {
    logger.error('Wallet error:', error, {
      walletError: error.name,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    })
  }
}

// Inner component that has access to wallet context
/**
 * Listens for wallet error events and disconnects the current wallet session.
 *
 * @param props.children - Descendant nodes rendered under the wallet provider.
 * @returns Wrapped children.
 */
const WalletErrorHandler = ({ children }: { children: ReactNode }): React.ReactNode => {
  const { wallet, disconnect } = useWallet()

  useEffect(() => {
    const handleWalletError = (): void => {
      if (wallet) {
        disconnect().catch(() => {
          // Ignore disconnect errors
        })
      }
    }

    window.addEventListener('wallet-error', handleWalletError)

    return (): void => {
      window.removeEventListener('wallet-error', handleWalletError)
    }
  }, [wallet, disconnect])

  return <>{children}</>
}

/**
 * Configures Solana connection and wallet providers for the client app.
 *
 * @param props.children - Descendant application nodes.
 * @returns Provider tree for wallet connectivity.
 */
export const SolanaProvider = ({ children }: { children: ReactNode }): React.ReactNode => {
  const { rpcPublicEndpoint } = useConfig()

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
