import { Coins, Send, Flame, ShieldOff, Droplets } from 'lucide-react'
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
}

export const getToolConfig = (toolName: string): ToolConfig => {
  const config = toolConfigs[toolName]
  if (!config) {
    throw new Error(`Tool configuration not found for: ${toolName}`)
  }
  return config
}
