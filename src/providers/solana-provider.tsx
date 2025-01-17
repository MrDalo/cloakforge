'use client'

import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { ReactNode, useCallback, useMemo } from 'react'
import { clusterApiUrl } from '@solana/web3.js'
import { createLogger } from '@/lib/logger/logger'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@solana/wallet-adapter-react-ui/styles.css')

const logger = createLogger({
  action: 'Connect wallet',
  file: 'solana-provider.tsx',
})

export const SolanaProvider = ({
  children,
}: {
  children: ReactNode
}): React.ReactNode => {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const onError = useCallback((error: WalletError) => {
    if (error.message === 'User rejected the request.') {
      toast.error(
        'Failed to connect you wallet. Process of connecting was cancelled.'
      )
    } else {
      toast.error('Failed to connect your wallet. Please try again.')
    }
    logger.error(error)
  }, [])

  const wallets = useMemo(
    () => [
      // manually add any legacy wallet adapters here
      // new UnsafeBurnerWalletAdapter(),
      // new SolflareWalletAdapter(),
      // new CoinbaseWalletAdapter(),
      // new TrustWalletAdapter(),
      // new LedgerWalletAdapter(),
      // new TrezorWalletAdapter(),
      // new PhantomWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect={true} onError={onError} wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
