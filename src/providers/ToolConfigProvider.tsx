'use client'

import { createContext, useContext, useEffect } from 'react'
import { type ToolConfiguration } from '@/lib/contentful/client'
import { useToolConfigStore } from '@/stores/toolConfigStore'
import { getFallbackToolConfigurations, withFeeFallbacks } from '@/lib/config/toolFeeFallbacks'

interface ToolConfigProviderProps {
  initialConfigs: ToolConfiguration[]
  children: React.ReactNode
}

/**
 * Tool configurations resolved on the server (Contentful -> cached values -> fallback fees),
 * available synchronously from the very first render (including SSR) — unlike the Zustand store,
 * which is only filled after mount.
 */
const ToolConfigurationsContext = createContext<ToolConfiguration[] | null>(null)

/**
 * Client component that initializes the tool config store with server-side data
 * This bridges server-side data fetching with client-side state management
 *
 * SECURITY: No client-side refresh functionality to prevent API abuse
 * Tool configs are updated only through server-side rendering
 */
export const ToolConfigProvider = ({ initialConfigs, children }: ToolConfigProviderProps): React.ReactElement => {
  const { setConfigs } = useToolConfigStore()

  useEffect(() => {
    // Initialize the store with server-side data
    setConfigs(initialConfigs)
  }, [initialConfigs, setConfigs])

  return <ToolConfigurationsContext.Provider value={initialConfigs}>{children}</ToolConfigurationsContext.Provider>
}

/**
 * Tool configurations (fees, enabled flags) for display — live Contentful values, cached values
 * during a Contentful outage, or the fallback fees. Every known tool is always present.
 * Outside a ToolConfigProvider the fallback configurations are returned.
 *
 * @returns Tool configurations covering every known tool.
 */
export const useToolConfigurations = (): ToolConfiguration[] => {
  const configs = useContext(ToolConfigurationsContext)
  return configs ? withFeeFallbacks(configs) : getFallbackToolConfigurations()
}

/**
 * SECURITY NOTE: Manual refresh functionality has been removed for security.
 *
 * Tool configurations are now updated only through:
 * 1. Page refresh (gets fresh server-side data)
 * 2. Navigation (triggers server-side data fetch)
 * 3. Automatic cache expiration (5-minute TTL)
 *
 * This prevents:
 * - Unauthorized API calls
 * - Information disclosure through public endpoints
 * - Potential abuse of refresh mechanisms
 *
 * To see config changes:
 * 1. Change settings in Contentful CMS
 * 2. Wait up to 5 minutes for cache expiration
 * 3. Refresh the page or navigate to see changes
 */
