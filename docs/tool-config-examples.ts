import { getCachedToolConfigurations } from '@/lib/contentful/toolConfigCache'

// Example: Create some mock tool configurations for testing
// In production, these would come from Contentful CMS
export const EXAMPLE_TOOL_CONFIGS = [
  {
    toolId: 'token-creator',
    isEnabled: true,
    fees: {
      baseFee: 0.1,
      networkFee: 0.001,
      priorityFee: 0.0001,
    },
  },
  {
    toolId: 'burn-tokens',
    isEnabled: false,
    disabledMessage: 'Token burning is temporarily disabled for maintenance. Please check back in 24 hours.',
    fees: {
      baseFee: 0.05,
      networkFee: 0.001,
    },
  },
  {
    toolId: 'transaction-multisender',
    isEnabled: true,
    fees: {
      baseFee: 0.01,
      networkFee: 0.001,
      priorityFee: 0.0005,
    },
  },
  {
    toolId: 'create-liquidity',
    isEnabled: false,
    disabledMessage: 'Liquidity creation is currently under development. Coming soon!',
    fees: {
      baseFee: 0.2,
      networkFee: 0.002,
    },
  },
]

/**
 * Development helper to test tool configurations
 * This simulates what would happen when you change settings in Contentful
 */
export async function getToolConfigExample(): Promise<typeof EXAMPLE_TOOL_CONFIGS> {
  // In production, this would call:
  // return await getCachedToolConfigurations()

  // For now, return mock data to demonstrate functionality
  return EXAMPLE_TOOL_CONFIGS
}

export { getCachedToolConfigurations }
