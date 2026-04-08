import { Coins, Droplets, Flame, Shield, Lock, UserX, Send, Scale, ScanEye, BookOpen, RefreshCw, FileText } from 'lucide-react'

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

export const defaultNavigationItems: NavigationGroup[] = [
  {
    title: 'default',
    items: [
      {
        title: 'Home',
        href: '/',
        description: 'Go to the homepage',
        icon: Coins,
      },
      {
        title: 'Pricing',
        href: '/#pricing',
        description: 'View our pricing plans',
        icon: Coins,
      },
    ],
  },
]

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
        title: 'Liquidity Provider',
        href: '/tools/liquidity-provider',
        description: 'Create Raydium liquidity pools',
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
        title: 'Freeze Wallets',
        href: '/tools/freeze-wallets',
        description: 'Temporarily disable token wallets',
        icon: UserX,
      },
      {
        title: 'Unfreeze Wallets',
        href: '/tools/unfreeze-wallets',
        description: 'Enable frozen token wallets',
        icon: RefreshCw,
      },
      {
        title: 'Transaction Multisender',
        href: '/tools/transaction-multisender',
        description: 'Send tokens to multiple addresses simultaneously',
        icon: Send,
      },
      {
        title: 'Token Auditor',
        href: '/tools/token-auditor',
        description: 'Analyze token distribution and ownership',
        icon: ScanEye,
      },
    ],
  },
]

export const othersNavigationItems: NavigationGroup[] = [
  {
    title: 'Others',
    items: [
      {
        title: 'Blog',
        href: '/blog',
        description: 'Tutorials and insights about Solana development',
        icon: BookOpen,
      },
      {
        title: 'Terms of Service',
        href: '/terms-of-service',
        description: 'Read our terms of service',
        icon: Scale,
      },
      {
        title: 'Privacy Policy',
        href: '/privacy-policy',
        description: 'Read our privacy policy',
        icon: Shield,
      },
      {
        title: 'Imprint',
        href: '/imprint',
        description: 'Legal information and company details',
        icon: FileText,
      },
    ],
  },
]
