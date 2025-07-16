import { ConfigContext } from '@/providers/ConfigProvider'
import { ConfigType } from '@/types/config'
import { useContext } from 'react'

export const useConfig = (): ConfigType => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
