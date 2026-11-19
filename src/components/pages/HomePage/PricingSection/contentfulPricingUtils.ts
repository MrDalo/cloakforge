import { Coins, Droplets, Flame, Shield, Lock, UserX, Send, Search, RefreshCw, Pencil, PenOff, type LucideIcon } from 'lucide-react'
import { type ToolConfiguration } from '@/lib/contentful/client'
import { type ServiceFee } from './pricingData'
import { TOKEN_CREATOR_OPTION_FEES, getFallbackToolConfigurations } from '@/lib/config/toolFeeFallbacks'
import { formatSol } from '@/lib/config/livePricing'

// Map of tool IDs to their display information
const TOOL_DISPLAY_MAP: Record<
  string,
  {
    service: string
    icon: LucideIcon
    description: string
    popular: boolean
  }
> = {
  'token-creator': {
    service: 'Token Creator',
    icon: Coins,
    description: 'Create professional SPL tokens',
    popular: true,
  },
  'liquidity-provider': {
    service: 'Liquidity Provider',
    icon: Droplets,
    description: 'Add liquidity to DEX pools',
    popular: true,
  },
  'burn-tokens': {
    service: 'Burn Tokens',
    icon: Flame,
    description: 'Permanently remove tokens',
    popular: false,
  },
  'revoke-mint-authority': {
    service: 'Revoke Mint Authority',
    icon: Shield,
    description: 'Disable token minting forever',
    popular: true,
  },
  'revoke-freeze-authority': {
    service: 'Revoke Freeze Authority',
    icon: Lock,
    description: 'Remove freeze capabilities',
    popular: false,
  },
  'freeze-wallets': {
    service: 'Freeze Wallets',
    icon: UserX,
    description: 'Temporarily disable wallets',
    popular: false,
  },
  'unfreeze-wallets': {
    service: 'Unfreeze Wallets',
    icon: RefreshCw,
    description: 'Restore wallet functionality',
    popular: false,
  },
  'transaction-multisender': {
    service: 'Transaction Multisender',
    icon: Send,
    description: 'Batch token transfers',
    popular: true,
  },
  'token-auditor': {
    service: 'Token Auditor',
    icon: Search,
    description: 'Comprehensive token security audit',
    popular: true,
  },
  'update-metadata': {
    service: 'Update Metadata',
    icon: Pencil,
    description: 'Update token name, symbol, logo and links',
    popular: false,
  },
  'revoke-metadata-authority': {
    service: 'Revoke Metadata Authority',
    icon: PenOff,
    description: 'Make token metadata immutable',
    popular: false,
  },
}

/** Tools charged per address (wallet / recipient) rather than per transaction */
const PER_ADDRESS_TOOLS = new Set(['transaction-multisender', 'freeze-wallets', 'unfreeze-wallets'])

/** Extra pricing details shown under a tool's fee */
const feeNoteFor = (toolId: string): string | undefined =>
  toolId === 'token-creator'
    ? `+${formatSol(TOKEN_CREATOR_OPTION_FEES.revokeMintAuthority)} to revoke mint authority, +${formatSol(TOKEN_CREATOR_OPTION_FEES.revokeFreezeAuthority)} to revoke freeze authority`
    : undefined

// Convert Contentful tool configurations to ServiceFee format
export function mapToolConfigurationsToServiceFees(toolConfigurations: ToolConfiguration[]): ServiceFee[] {
  return toolConfigurations
    .filter((config) => TOOL_DISPLAY_MAP[config.toolId])
    .map((config) => {
      const displayInfo = TOOL_DISPLAY_MAP[config.toolId]

      // Format fee display
      const feeDisplay = PER_ADDRESS_TOOLS.has(config.toolId) ? `${formatSol(config.baseFee)} per 1 address` : formatSol(config.baseFee)

      // Format network fee estimate
      const networkFeeDisplay = `~${formatSol(config.networkFee)}`

      return {
        service: displayInfo.service,
        icon: displayInfo.icon,
        fee: feeDisplay,
        feeNote: feeNoteFor(config.toolId),
        description: displayInfo.description,
        estimatedNetwork: networkFeeDisplay,
        popular: displayInfo.popular,
        isEnabled: config.isEnabled ?? true,
      }
    })
    .sort((a, b) => {
      // Sort by popularity first, then alphabetically
      if (a.popular && !b.popular) return -1
      if (!a.popular && b.popular) return 1
      return a.service.localeCompare(b.service)
    })
}

// Fallback service fees if Contentful data is not available — derived from the global fallback fees
export const fallbackServiceFees: ServiceFee[] = mapToolConfigurationsToServiceFees(getFallbackToolConfigurations())
