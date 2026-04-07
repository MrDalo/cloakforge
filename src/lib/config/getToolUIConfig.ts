import { Coins, Send, Flame, ShieldOff, Droplets, Search, Snowflake, RefreshCw } from 'lucide-react'
import { GradientVariant } from '@/components/common/UnifiedForm'

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
  'freeze-accounts': {
    title: 'Freeze Token Accounts',
    icon: Snowflake,
    variant: 'info',
    submitText: 'Freeze Accounts',
    loadingText: 'Freezing Accounts...',
  },
  'unfreeze-accounts': {
    title: 'Unfreeze Accounts',
    icon: RefreshCw,
    variant: 'info',
    submitText: 'Unfreeze Accounts',
    loadingText: 'Unfreezing Accounts...',
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

export const getToolUIConfig = (toolName: string): ToolUIConfig => {
  const config = toolUIConfigs[toolName]
  if (!config) {
    throw new Error(`Tool UI configuration not found for: ${toolName}`)
  }
  return config
}
