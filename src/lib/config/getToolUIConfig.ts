import { Coins, Send, Flame, ShieldOff, PenOff, Droplets, Search, Snowflake, RefreshCw, Pencil } from 'lucide-react'
import { type GradientVariant } from '@/components/common/UnifiedForm'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'

export interface ToolUIConfig {
  title: string
  description?: string
  icon: typeof Coins
  variant: GradientVariant
  submitText: string
  loadingText: string
  baseFee?: number
  networkFee?: number
}

/**
 * UI metadata map for tool pages.
 */
export const toolUIConfigs: Record<string, ToolUIConfig> = {
  'token-creator': {
    title: 'Create Your Token',
    icon: Coins,
    variant: 'primary',
    submitText: 'Create Token',
    loadingText: 'Creating Token...',
  },
  'transaction-multisender': {
    title: 'Send to Multiple Recipients',
    icon: Send,
    variant: 'info',
    submitText: 'Send Tokens',
    loadingText: 'Sending Tokens...',
  },
  'burn-tokens': {
    title: 'Burn Your Tokens',
    icon: Flame,
    variant: 'danger',
    submitText: 'Burn Tokens',
    loadingText: 'Burning Tokens...',
  },
  'revoke-mint-authority': {
    title: 'Revoke Mint Authority',
    icon: ShieldOff,
    variant: 'success',
    submitText: 'Revoke Authority',
    loadingText: 'Revoking Authority...',
  },
  'revoke-freeze-authority': {
    title: 'Revoke Freeze Authority',
    icon: ShieldOff,
    variant: 'success',
    submitText: 'Revoke Authority',
    loadingText: 'Revoking Authority...',
  },
  'revoke-metadata-authority': {
    title: 'Revoke Metadata Authority',
    icon: PenOff,
    variant: 'success',
    submitText: 'Revoke Authority',
    loadingText: 'Revoking Authority...',
  },
  'update-metadata': {
    title: 'Update Token Metadata',
    icon: Pencil,
    variant: 'primary',
    submitText: 'Update Metadata',
    loadingText: 'Updating Metadata...',
  },
  'freeze-wallets': {
    title: 'Freeze Token Wallets',
    icon: Snowflake,
    variant: 'info',
    submitText: 'Freeze Wallets',
    loadingText: 'Freezing Wallets...',
  },
  'unfreeze-wallets': {
    title: 'Unfreeze Wallets',
    icon: RefreshCw,
    variant: 'warning',
    submitText: 'Unfreeze Wallets',
    loadingText: 'Unfreezing Wallets...',
  },
  'token-auditor': {
    title: 'Token Auditor',
    icon: Search,
    variant: 'primary',
    submitText: 'Start Audit',
    loadingText: 'Auditing Token...',
  },
  'liquidity-provider': {
    title: 'Liquidity Provider',
    description: 'Create liquidity pools on Raydium',
    icon: Droplets,
    variant: 'emerald',
    submitText: 'Create Pool',
    loadingText: 'Creating Pool...',
    baseFee: TOOL_FEE_FALLBACKS['liquidity-provider'].baseFee,
    networkFee: TOOL_FEE_FALLBACKS['liquidity-provider'].networkFee,
  },
}

/**
 * Retrieves UI configuration for a given tool id.
 *
 * @param toolName - Tool route/id.
 * @returns Tool UI configuration.
 * @throws Error when configuration is missing.
 */
export const getToolUIConfig = (toolName: string): ToolUIConfig => {
  const config = toolUIConfigs[toolName]
  if (!config) {
    throw new Error(`Tool UI configuration not found for: ${toolName}`)
  }
  return config
}
