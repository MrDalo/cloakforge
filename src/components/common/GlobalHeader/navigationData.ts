import { Coins, Droplets, Flame, Shield, Lock, UserX, Send, Scale } from 'lucide-react'

export interface NavigationItem {
  title: string
  href: string
  description: string
  icon: typeof Coins
}

export interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

export const toolsNavigationItems: NavigationGroup[] = [
  {
    title: 'Tools',
    items: [
      {
        title: 'Token Creator',
        href: '/tools/token-creator',
        description: 'Create professional SPL tokens with custom metadata',
        icon: Coins,
      },
      {
        title: 'Create Liquidity',
        href: '/tools/create-liquidity',
        description: 'Add liquidity to DEXs and create trading pairs',
        icon: Droplets,
      },
      {
        title: 'Burn Tokens',
        href: '/tools/burn-tokens',
        description: 'Permanently remove tokens from circulation',
        icon: Flame,
      },
      {
        title: 'Revoke Mint Authority',
        href: '/tools/revoke-mint-authority',
        description: 'Permanently disable token minting',
        icon: Shield,
      },
      {
        title: 'Revoke Freeze Authority',
        href: '/tools/revoke-freeze-authority',
        description: 'Remove freeze capabilities for decentralization',
        icon: Lock,
      },
      {
        title: 'Freeze Accounts',
        href: '/tools/freeze-accounts',
        description: 'Temporarily disable token accounts',
        icon: UserX,
      },
      {
        title: 'Transaction Multisender',
        href: '/tools/transaction-multisender',
        description: 'Send tokens to multiple addresses simultaneously',
        icon: Send,
      },
    ],
  },
]

export const othersNavigationItems: NavigationGroup[] = [
  {
    title: 'Others',
    items: [
      {
        title: 'Terms of Service',
        href: '/terms-of-service',
        description: 'Read our terms of service',
        icon: Scale,
      },
    ],
  },
]
