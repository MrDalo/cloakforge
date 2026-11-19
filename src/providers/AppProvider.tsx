import React from 'react'
import QueryProvider from './QueryProvider'
import { SolanaProvider } from './SolanaProvider'
import getConfig from '@/lib/config/getConfig'
import { ConfigProvider } from './ConfigProvider'
import { ToolConfigProvider } from './ToolConfigProvider'
import { getToolConfigurationsWithFallback } from '@/lib/contentful/toolConfigCache'

interface AppProviderProps {
  children: React.ReactNode
}

/**
 * Server provider compositor that hydrates config and tool settings for the app.
 *
 * @param props.children - Application subtree.
 * @returns Combined provider tree with server-fetched configuration.
 */
const AppProvider = async ({ children }: AppProviderProps): Promise<React.ReactNode> => {
  const config = getConfig()
  // Completed with fallback fees so fee displays and balance checks work even when Contentful is down
  const toolConfigs = await getToolConfigurationsWithFallback()

  return (
    <ConfigProvider value={config}>
      <SolanaProvider>
        <QueryProvider>
          <ToolConfigProvider initialConfigs={toolConfigs}>{children}</ToolConfigProvider>
        </QueryProvider>
      </SolanaProvider>
    </ConfigProvider>
  )
}

export default AppProvider
