'use client'
import { type ConfigType } from '@/types/config'
import { createContext, type ReactNode } from 'react'

/**
 * React context that stores runtime application configuration.
 */
export const ConfigContext = createContext<ConfigType | undefined>(undefined)

/**
 * Provides application configuration to all client descendants.
 *
 * @param props.value - Configuration object.
 * @param props.children - Descendant React nodes.
 * @returns Config context provider node.
 */
export const ConfigProvider = ({ value, children }: { value: ConfigType; children: ReactNode }): React.ReactNode => (
  <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
)
