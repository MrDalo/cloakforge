/**
 * Global Tool Type Definitions
 *
 * Centralized tool type definitions used across the entire SolCloak application.
 * This ensures consistency and prevents duplication of tool type definitions.
 *
 * When adding new tools:
 * 1. Add the tool type here
 * 2. Update toolUIConfigs in /src/lib/config/getToolUIConfig.ts
 * 3. Update toolFeeConfigs in /src/lib/utils/feeConfigs.ts
 * 4. Update navigation in /src/components/common/GlobalHeader/navigationData.ts
 */

/**
 * Core tool types representing individual SolCloak tools
 */
export type CoreToolType =
  | 'token-creator'
  | 'burn-tokens'
  | 'transaction-multisender'
  | 'freeze-accounts'
  | 'unfreeze-accounts'
  | 'revoke-mint-authority'
  | 'revoke-freeze-authority'
  | 'create-liquidity'
  | 'token-auditor'

/**
 * Extended tool type including special cases for queries and UI
 */
export type ToolType = CoreToolType | 'all' | 'default'

/**
 * Server-side tool type for API operations (aliases for consistency)
 */
export type ServerToolType = CoreToolType | 'all'

/**
 * Utility type to check if a string is a valid tool type
 */
export function isValidToolType(value: string): value is ToolType {
  const validTypes: ToolType[] = [
    'token-creator',
    'burn-tokens',
    'transaction-multisender',
    'freeze-accounts',
    'unfreeze-accounts',
    'revoke-mint-authority',
    'revoke-freeze-authority',
    'create-liquidity',
    'token-auditor',
    'all',
    'default',
  ]
  return validTypes.includes(value as ToolType)
}

/**
 * Utility type to check if a string is a valid core tool type
 */
export function isValidCoreToolType(value: string): value is CoreToolType {
  const validTypes: CoreToolType[] = [
    'token-creator',
    'burn-tokens',
    'transaction-multisender',
    'freeze-accounts',
    'unfreeze-accounts',
    'revoke-mint-authority',
    'revoke-freeze-authority',
    'create-liquidity',
    'token-auditor',
  ]
  return validTypes.includes(value as CoreToolType)
}

/**
 * Map tool types to their display names
 */
export const TOOL_DISPLAY_NAMES: Record<CoreToolType, string> = {
  'token-creator': 'Token Creator',
  'burn-tokens': 'Burn Tokens',
  'transaction-multisender': 'Transaction Multisender',
  'freeze-accounts': 'Freeze Accounts',
  'unfreeze-accounts': 'Unfreeze Accounts',
  'revoke-mint-authority': 'Revoke Mint Authority',
  'revoke-freeze-authority': 'Revoke Freeze Authority',
  'create-liquidity': 'Create Liquidity',
  'token-auditor': 'Token Auditor',
} as const

/**
 * Get display name for a tool type
 */
export function getToolDisplayName(toolType: CoreToolType): string {
  return TOOL_DISPLAY_NAMES[toolType]
}

/**
 * Tools that require authority information for token operations
 */
export const AUTHORITY_REQUIRED_TOOLS: CoreToolType[] = [
  'revoke-mint-authority',
  'revoke-freeze-authority',
  'freeze-accounts',
  'unfreeze-accounts',
] as const

/**
 * Check if a tool requires authority information
 */
export function requiresAuthorities(toolType: ToolType): boolean {
  return AUTHORITY_REQUIRED_TOOLS.includes(toolType as CoreToolType)
}
