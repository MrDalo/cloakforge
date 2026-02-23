import { ConfigContext } from '@/providers/ConfigProvider'
import { type ConfigType } from '@/types/config'
import { useContext } from 'react'

/**
 * Returns application configuration from context.
 *
 * @returns The active app configuration.
 * @throws Error when used outside of the ConfigProvider.
 */
export const useConfig = (): ConfigType => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
