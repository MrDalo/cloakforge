import React from 'react'
import QueryProvider from './query-provider'
import { SolanaProvider } from './solana-provider'

const AppProvider = ({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode => (
  <QueryProvider>
    <SolanaProvider>{children}</SolanaProvider>
  </QueryProvider>
)

export default AppProvider
