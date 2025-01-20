import React from 'react'
import QueryProvider from './query-provider'
import { SolanaProvider } from './solana-provider'
import getConfig from '@/lib/config/config'
import { ConfigProvider } from './config-provider'

const AppProvider = ({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode => {
  const config = getConfig()
  return (
    <ConfigProvider value={config}>
      <SolanaProvider>
        <QueryProvider>{children}</QueryProvider>
      </SolanaProvider>
    </ConfigProvider>
  )
}

export default AppProvider
