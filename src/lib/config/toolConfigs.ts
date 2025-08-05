import { Coins, Send, Flame, ShieldOff, Droplets, Search, Snowflake, RefreshCw } from 'lucide-react'
import { GradientVariant } from '@/components/common/UnifiedForm'

export interface ToolConfig {
  title: string
  icon: typeof Coins
  variant: GradientVariant
  submitText: string
  loadingText: string
}

export const toolConfigs: Record<string, ToolConfig> = {
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
}

export const getToolConfig = (toolName: string): ToolConfig => {
  const config = toolConfigs[toolName]
  if (!config) {
    throw new Error(`Tool configuration not found for: ${toolName}`)
  }
  return config
}
