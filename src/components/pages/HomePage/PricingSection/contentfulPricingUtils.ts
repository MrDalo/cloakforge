import { Coins, Droplets, Flame, Shield, Lock, UserX, Send, Search, RefreshCw, type LucideIcon } from 'lucide-react'
import { type ToolConfiguration } from '@/lib/contentful/client'
import { type ServiceFee } from './pricingData'

// Map of tool IDs to their display information
const TOOL_DISPLAY_MAP: Record<
  string,
  {
    service: string
    icon: LucideIcon
    description: string
    complexity: 'Low' | 'Medium' | 'High' | 'Variable'
    popular: boolean
  }
> = {
  'token-creator': {
    service: 'Token Creator',
    icon: Coins,
    description: 'Create professional SPL tokens',
    complexity: 'Medium',
    popular: true,
  },
  'liquidity-provider': {
    service: 'Liquidity Provider',
    icon: Droplets,
    description: 'Add liquidity to DEX pools',
    complexity: 'Low',
    popular: true,
  },
  'burn-tokens': {
    service: 'Burn Tokens',
    icon: Flame,
    description: 'Permanently remove tokens',
    complexity: 'Low',
    popular: false,
  },
  'revoke-mint-authority': {
    service: 'Revoke Mint Authority',
    icon: Shield,
    description: 'Disable token minting forever',
    complexity: 'Low',
    popular: true,
  },
  'revoke-freeze-authority': {
    service: 'Revoke Freeze Authority',
    icon: Lock,
    description: 'Remove freeze capabilities',
    complexity: 'Low',
    popular: false,
  },
  'freeze-wallets': {
    service: 'Freeze Wallets',
    icon: UserX,
    description: 'Temporarily disable wallets',
    complexity: 'Low',
    popular: false,
  },
  'unfreeze-wallets': {
    service: 'Unfreeze Wallets',
    icon: RefreshCw,
    description: 'Restore wallet functionality',
    complexity: 'Low',
    popular: false,
  },
  'transaction-multisender': {
    service: 'Transaction Multisender',
    icon: Send,
    description: 'Batch token transfers',
    complexity: 'Variable',
    popular: true,
  },
  'token-auditor': {
    service: 'Token Auditor',
    icon: Search,
    description: 'Comprehensive token security audit',
    complexity: 'High',
    popular: true,
  },
}

// Convert Contentful tool configurations to ServiceFee format
export function mapToolConfigurationsToServiceFees(toolConfigurations: ToolConfiguration[]): ServiceFee[] {
  return toolConfigurations
    .filter((config) => TOOL_DISPLAY_MAP[config.toolId])
    .map((config) => {
      const displayInfo = TOOL_DISPLAY_MAP[config.toolId]

      // Format fee display
      let feeDisplay: string
      if (['transaction-multisender', 'freeze-wallets', 'unfreeze-wallets'].includes(config.toolId)) {
        feeDisplay = `${config.baseFee} SOL per 1 address`
      } else {
        feeDisplay = `${config.baseFee} SOL`
      }

      // Format network fee estimate
      const networkFeeDisplay = `~${config.networkFee} SOL`

      return {
        service: displayInfo.service,
        icon: displayInfo.icon,
        fee: feeDisplay,
        description: displayInfo.description,
        complexity: displayInfo.complexity,
        estimatedNetwork: networkFeeDisplay,
        popular: displayInfo.popular,
      }
    })
    .sort((a, b) => {
      // Sort by popularity first, then alphabetically
      if (a.popular && !b.popular) return -1
      if (!a.popular && b.popular) return 1
      return a.service.localeCompare(b.service)
    })
}

// Fallback service fees if Contentful data is not available
export const fallbackServiceFees: ServiceFee[] = [
  {
    service: 'Token Creator',
    icon: Coins,
    fee: '0.19 SOL',
    description: 'Create professional SPL tokens',
    complexity: 'Medium',
    estimatedNetwork: '~0.0005 SOL',
    popular: true,
  },
  {
    service: 'Liquidity Provider',
    icon: Droplets,
    fee: '0.1 SOL',
    description: 'Add liquidity to DEX pools',
    complexity: 'Low',
    estimatedNetwork: '~0.0005 SOL',
    popular: true,
  },
  {
    service: 'Revoke Mint Authority',
    icon: Shield,
    fee: '0.1 SOL',
    description: 'Disable token minting forever',
    complexity: 'Low',
    estimatedNetwork: '~0.0005 SOL',
    popular: true,
  },
  {
    service: 'Transaction Multisender',
    icon: Send,
    fee: '0.001 SOL per 1 address',
    description: 'Batch token transfers',
    complexity: 'Variable',
    estimatedNetwork: '~0.0005 SOL',
    popular: true,
  },
  {
    service: 'Token Auditor',
    icon: Search,
    fee: '0.1 SOL',
    description: 'Comprehensive token security audit',
    complexity: 'High',
    estimatedNetwork: '~0.0005 SOL',
    popular: true,
  },
  {
    service: 'Burn Tokens',
    icon: Flame,
    fee: '0.009 SOL',
    description: 'Permanently remove tokens',
    complexity: 'Low',
    estimatedNetwork: '~0.0005 SOL',
    popular: false,
  },
  {
    service: 'Revoke Freeze Authority',
    icon: Lock,
    fee: '0.1 SOL',
    description: 'Remove freeze capabilities',
    complexity: 'Low',
    estimatedNetwork: '~0.0005 SOL',
    popular: false,
  },
  {
    service: 'Freeze Wallets',
    icon: UserX,
    fee: '0.01 SOL per 1 address',
    description: 'Temporarily disable wallets',
    complexity: 'Low',
    estimatedNetwork: '~0.0005 SOL',
    popular: false,
  },
  {
    service: 'Unfreeze Wallets',
    icon: RefreshCw,
    fee: '0.01 SOL per 1 address',
    description: 'Restore wallet functionality',
    complexity: 'Low',
    estimatedNetwork: '~0.0005 SOL',
    popular: false,
  },
]
