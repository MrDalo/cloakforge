'use client'

import { useToolConfigStore } from '@/stores/toolConfigStore'
import { mapToolConfigurationsToServiceFees, fallbackServiceFees } from './contentfulPricingUtils'
import { type ServiceFee } from './pricingData'

// Custom hook to get service fees from the client-side store
export const useServiceFees = (): ServiceFee[] => {
  const { configs } = useToolConfigStore()

  // Convert configs object to array
  const toolConfigurations = Object.values(configs)

  // If we have Contentful data, use it; otherwise use fallback
  if (toolConfigurations.length > 0) {
    return mapToolConfigurationsToServiceFees(toolConfigurations)
  }

  return fallbackServiceFees
}
