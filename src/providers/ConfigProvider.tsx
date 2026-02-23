'use client'
import { type ConfigType } from '@/types/config'
import { createContext, type ReactNode } from 'react'

export const ConfigContext = createContext<ConfigType | undefined>(undefined)

export const ConfigProvider = ({ value, children }: { value: ConfigType; children: ReactNode }): React.ReactNode => (
  <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
)
