import { Coins, Send, Flame, ShieldOff, Droplets, Unlock, Search, Snowflake } from 'lucide-react'
import { GradientVariant } from '@/components/common/UnifiedForm'

export interface ToolConfig {
  title: string
  icon: typeof Coins
  variant: GradientVariant
  submitText: string
  loadingText: string
  showPreview?: boolean
  previewText?: string
  fees?: {
    amount: number
    currency: string
  }
}

export const toolConfigs: Record<string, ToolConfig> = {
  'token-creator': {
    title: 'Create Your Token',
    icon: Coins,
    variant: 'primary',
    submitText: 'Create Token',
    loadingText: 'Creating Token...',
    showPreview: true,
    previewText: 'Preview Transaction',
    fees: {
      amount: 0.0015,
      currency: 'SOL',
    },
  },
  'transaction-multisender': {
    title: 'Send to Multiple Recipients',
    icon: Send,
    variant: 'info',
    submitText: 'Send Tokens',
    loadingText: 'Sending Tokens...',
    showPreview: false,
  },
  'burn-tokens': {
    title: 'Burn Your Tokens',
    icon: Flame,
    variant: 'danger',
    submitText: 'Burn Tokens',
    loadingText: 'Burning Tokens...',
    showPreview: false,
  },
  'revoke-mint-authority': {
    title: 'Revoke Mint Authority',
    icon: ShieldOff,
    variant: 'success',
    submitText: 'Revoke Authority',
    loadingText: 'Revoking Authority...',
    showPreview: true,
    previewText: 'Preview Transaction',
  },
  'revoke-freeze-authority': {
    title: 'Revoke Freeze Authority',
    icon: ShieldOff,
    variant: 'success',
    submitText: 'Revoke Authority',
    loadingText: 'Revoking Authority...',
    showPreview: true,
    previewText: 'Preview Transaction',
  },
  'create-liquidity': {
    title: 'Create Liquidity Pool',
    icon: Droplets,
    variant: 'success',
    submitText: 'Create Pool',
    loadingText: 'Creating Pool...',
    showPreview: true,
    previewText: 'Preview Transaction',
  },
  'freeze-accounts': {
    title: 'Freeze Token Accounts',
    icon: Snowflake,
    variant: 'info',
    submitText: 'Freeze Accounts',
    loadingText: 'Freezing Accounts...',
    showPreview: true,
    previewText: 'Preview Transaction',
  },
  'unfreeze-accounts': {
    title: 'Unfreeze Accounts',
    icon: Unlock,
    variant: 'info',
    submitText: 'Unfreeze Accounts',
    loadingText: 'Unfreezing Accounts...',
    showPreview: true,
    previewText: 'Preview Transaction',
  },
  'token-auditor': {
    title: 'Token Auditor',
    icon: Search,
    variant: 'primary',
    submitText: 'Start Audit',
    loadingText: 'Auditing Token...',
    showPreview: false,
  },
}

export const getToolConfig = (toolName: string): ToolConfig => {
  const config = toolConfigs[toolName]
  if (!config) {
    throw new Error(`Tool configuration not found for: ${toolName}`)
  }
  return config
}
