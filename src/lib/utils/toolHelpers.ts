/**
 * Shared Tool Utility Functions
 *
 * Common utilities used across both client and server components
 * for tool-specific operations and validation.
 */

import { type ToolType, requiresAuthorities } from '@/types/toolTypes'

// Re-export types for convenience
export type { ToolType } from '@/types/toolTypes'
export { requiresAuthorities } from '@/types/toolTypes'

/**
 * Gets optimal stale time for TanStack Query based on tool requirements
 * Authority-based tools need more frequent updates since authorities can change
 */
export function getStaleTimeForTool(toolType: ToolType): number {
  // Authority-based tools need more frequent updates since authorities can change
  if (requiresAuthorities(toolType)) {
    return 60000 // 1 minute
  }

  if (toolType === 'burn-tokens') {
    return Infinity
  }

  // Token balance changes more frequently for burn/transfer operations
  if (toolType === 'create-liquidity') {
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
  'burn-tokens': {
    requiresAuthorities: false,
    requiresNonZeroBalance: true,
    cacheTime: Infinity,
    description: 'Burn tokens to reduce supply',
  },
  'revoke-mint-authority': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Remove mint authority for decentralization',
  },
  'revoke-freeze-authority': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Remove freeze authority for decentralization',
  },
  'freeze-accounts': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Freeze token accounts',
  },
  'unfreeze-accounts': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Unfreeze token accounts',
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
  'token-auditor': {
    requiresAuthorities: false,
    requiresNonZeroBalance: false,
    cacheTime: 300000, // 5 minutes
    description: 'Audit token security and metadata',
  },
  'transaction-multisender': {
    requiresAuthorities: false,
    requiresNonZeroBalance: true,
    cacheTime: 120000, // 2 minutes
    description: 'Send tokens to multiple recipients',
  },
  all: {
    requiresAuthorities: false,
    requiresNonZeroBalance: false,
    cacheTime: 120000,
    description: 'All wallet tokens',
  },
  default: {
    requiresAuthorities: false,
    requiresNonZeroBalance: false,
    cacheTime: 120000,
    description: 'Default tool configuration',
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
    'burn-tokens': 'Burn Tokens',
    'revoke-mint-authority': 'Revoke Mint Authority',
    'revoke-freeze-authority': 'Revoke Freeze Authority',
    'freeze-accounts': 'Freeze Accounts',
    'unfreeze-accounts': 'Unfreeze Accounts',
    'create-liquidity': 'Create Liquidity',
    'token-creator': 'Token Creator',
    'token-auditor': 'Token Auditor',
    'transaction-multisender': 'Transaction Multisender',
    all: 'All Tokens',
    default: 'Default',
  }
  return names[toolType]
}
