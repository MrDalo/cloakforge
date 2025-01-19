import React from 'react'
import QueryProvider from './query-provider'
import { SolanaProvider } from './solana-provider'

const AppProvider = ({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode => (
  <SolanaProvider>
    <QueryProvider>{children}</QueryProvider>
  </SolanaProvider>
)

export default AppProvider
