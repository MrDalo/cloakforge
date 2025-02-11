/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger'
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust'
import { ReactNode, useCallback, useMemo } from 'react'
import { createLogger } from '@/lib/logger/logger'
import { toast } from 'sonner'
import { useConfig } from '@/hooks/context/useConfig'

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
  const network = WalletAdapterNetwork.Mainnet
  const { rpcEndpoint } = useConfig()

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
      new PhantomWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolflareWalletAdapter(),
      new TrustWalletAdapter(),
    ],
    [network]
  )

  return (
    <ConnectionProvider endpoint={rpcEndpoint}>
      <WalletProvider autoConnect={true} onError={onError} wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
