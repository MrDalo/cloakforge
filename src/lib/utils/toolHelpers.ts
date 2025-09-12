/**
 * Shared Tool Utility Functions
 *
 * Common utilities used across both client and server components
 * for tool-specific operations and validation.
 */

export type ToolType =
  | 'burn-token'
  | 'revoke-mint-authority'
  | 'revoke-freeze-authority'
  | 'freeze-accounts'
  | 'unfreeze-accounts'
  | 'create-liquidity'
  | 'token-creator'
  | 'all'

/**
 * Determines whether authority information is needed for a specific tool
 * Used in both client hooks and server-side API to optimize data fetching
 */
export function shouldIncludeAuthorities(toolType: ToolType): boolean {
  return ['revoke-mint-authority', 'revoke-freeze-authority', 'freeze-accounts', 'unfreeze-accounts'].includes(toolType)
}

/**
 * Gets optimal stale time for TanStack Query based on tool requirements
 * Authority-based tools need more frequent updates since authorities can change
 */
export function getStaleTimeForTool(toolType: ToolType): number {
  // Authority-based tools need more frequent updates since authorities can change
  if (shouldIncludeAuthorities(toolType)) {
    return 60000 // 1 minute
  }

  // Token balance changes more frequently for burn/transfer operations
  if (toolType === 'burn-token' || toolType === 'create-liquidity') {
    return 30000 // 30 seconds
  }

  // General token list can be cached longer
  return 120000 // 2 minutes
}

/**
 * Tool configuration for features and requirements
 */
export interface ToolConfig {
  requiresAuthorities: boolean
  requiresNonZeroBalance: boolean
  cacheTime: number
  description: string
}

export const TOOL_CONFIGS: Record<ToolType, ToolConfig> = {
  'burn-token': {
    requiresAuthorities: false,
    requiresNonZeroBalance: true,
    cacheTime: 30000,
    description: 'Permanently destroy tokens from your wallet',
  },
  'revoke-mint-authority': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Remove the ability to mint additional tokens',
  },
  'revoke-freeze-authority': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Remove the ability to freeze token accounts',
  },
  'freeze-accounts': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Freeze specific token accounts',
  },
  'unfreeze-accounts': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Unfreeze previously frozen token accounts',
  },
  'create-liquidity': {
    requiresAuthorities: false,
    requiresNonZeroBalance: true,
    cacheTime: 30000,
    description: 'Create liquidity pools for trading',
  },
  'token-creator': {
    requiresAuthorities: false,
    requiresNonZeroBalance: false,
    cacheTime: 900000, // 15 minutes - longer since this is for validation/reference
    description: 'Create new SPL tokens with metadata and authorities',
  },
  all: {
    requiresAuthorities: false,
    requiresNonZeroBalance: false,
    cacheTime: 120000,
    description: 'All wallet tokens',
  },
}

/**
 * Gets tool configuration for a specific tool type
 */
export function getToolConfig(toolType: ToolType): ToolConfig {
  return TOOL_CONFIGS[toolType]
}

/**
 * Validates if a tool type is valid
 */
export function isValidToolType(toolType: string): toolType is ToolType {
  return Object.keys(TOOL_CONFIGS).includes(toolType as ToolType)
}

/**
 * Gets human-readable tool name
 */
export function getToolDisplayName(toolType: ToolType): string {
  const names: Record<ToolType, string> = {
    'burn-token': 'Burn Tokens',
    'revoke-mint-authority': 'Revoke Mint Authority',
    'revoke-freeze-authority': 'Revoke Freeze Authority',
    'freeze-accounts': 'Freeze Accounts',
    'unfreeze-accounts': 'Unfreeze Accounts',
    'create-liquidity': 'Create Liquidity',
    'token-creator': 'Token Creator',
    all: 'All Tokens',
  }
  return names[toolType]
}
