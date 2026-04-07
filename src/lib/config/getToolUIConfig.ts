import { Coins, Send, Flame, ShieldOff, Droplets, Search, Snowflake, RefreshCw } from 'lucide-react'
import { type GradientVariant } from '@/components/common/UnifiedForm'

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
  'create-liquidity': {
    title: 'Create Liquidity Pool',
    icon: Droplets,
    variant: 'success',
    submitText: 'Create Pool',
    loadingText: 'Creating Pool...',
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
    baseFee: 0.19,
    networkFee: 0.0005,
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
