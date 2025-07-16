import React from 'react'
import QueryProvider from './QueryProvider'
import { SolanaProvider } from './SolanaProvider'
import getConfig from '@/lib/config/config'
import { ConfigProvider } from './ConfigProvider'

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
