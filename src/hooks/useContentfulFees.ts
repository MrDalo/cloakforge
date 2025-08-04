'use client'

import { useToolConfig } from '@/stores/toolConfigStore'

interface UseContentfulFeesReturn {
  fees: {
    baseFee: number
    networkFee: number
    priorityFee?: number
  } | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook to get Contentful fees for a specific tool
 * Uses the existing ToolConfigProvider and store for secure server-side data
 */
export const useContentfulFees = (toolId: string): UseContentfulFeesReturn => {
  const { config } = useToolConfig(toolId)

  // Return fees if config exists
  const fees = config
    ? {
        baseFee: config.baseFee,
        networkFee: config.networkFee,
        priorityFee: config.priorityFee,
      }
    : null

  // No loading state needed since data comes from server-side provider
  // No error state needed since fallbacks are handled in components
  return {
    fees,
    isLoading: false,
    error: null,
  }
}
