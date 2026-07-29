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
 * Returns the optimal stale time for TanStack Query based on tool requirements.
 * Authority-based tools require more frequent updates because authorities can change.
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
  if (toolType === 'liquidity-provider') {
    return 30000 // 30 seconds
  }

  // General token list can be cached longer
  return 120000 // 2 minutes
}

/**
 * Tool configuration model for feature requirements.
 */
export interface ToolConfig {
  requiresAuthorities: boolean
  requiresNonZeroBalance: boolean
  cacheTime: number
  description: string
}

/**
 * Static tool behavior metadata used by hooks and UI helpers.
 */
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
  'revoke-metadata-authority': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Permanently revoke token metadata update authority',
  },
  'update-metadata': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Update token metadata fields for tokens you control',
  },
  'freeze-wallets': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Freeze token wallets',
  },
  'unfreeze-wallets': {
    requiresAuthorities: true,
    requiresNonZeroBalance: false,
    cacheTime: 60000,
    description: 'Unfreeze token wallets',
  },
  'liquidity-provider': {
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
 * Returns the configuration for a specific tool type.
 */
export function getToolConfig(toolType: ToolType): ToolConfig {
  return TOOL_CONFIGS[toolType]
}

/**
 * Validates whether a tool type string is supported.
 */
export function isValidToolType(toolType: string): toolType is ToolType {
  return Object.keys(TOOL_CONFIGS).includes(toolType as ToolType)
}

/**
 * Returns a human-readable display name for a tool type.
 */
export function getToolDisplayName(toolType: ToolType): string {
  const names: Record<ToolType, string> = {
    'burn-tokens': 'Burn Tokens',
    'revoke-mint-authority': 'Revoke Mint Authority',
    'revoke-freeze-authority': 'Revoke Freeze Authority',
    'revoke-metadata-authority': 'Revoke Metadata Authority',
    'update-metadata': 'Update Token Metadata',
    'freeze-wallets': 'Freeze Wallets',
    'unfreeze-wallets': 'Unfreeze Wallets',
    'liquidity-provider': 'Liquidity Provider',
    'token-creator': 'Token Creator',
    'token-auditor': 'Token Auditor',
    'transaction-multisender': 'Transaction Multisender',
    all: 'All Tokens',
    default: 'Default',
  }
  return names[toolType]
}
