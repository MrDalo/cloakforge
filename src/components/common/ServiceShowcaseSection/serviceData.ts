import { Coins, Droplets, Flame, Shield, Lock, UserX, Send, Unlock, Search } from 'lucide-react'

export interface Service {
  id: string
  title: string
  description: string
  icon: typeof Coins
  color: 'primary' | 'secondary' | 'destructive' | 'warning' | 'info'
  features: string[]
  highlight: string
  href: string
}

export const services: Service[] = [
  {
    id: 'token-creator',
    title: 'Token Creator',
    description: 'Launch professional SPL tokens with custom metadata, supply controls, and advanced features.',
    icon: Coins,
    color: 'primary',
    features: ['Custom Metadata', 'Supply Control', 'Advanced Features'],
    highlight: 'Most Popular',
    href: '/tools/token-creator',
  },
  {
    id: 'create-liquidity',
    title: 'Create Liquidity',
    description: 'Add liquidity to DEXs and create trading pairs with optimized routing and minimal slippage.',
    icon: Droplets,
    color: 'secondary',
    features: ['DEX Integration', 'Optimal Routing', 'Minimal Slippage'],
    highlight: 'Fast & Efficient',
    href: '/tools/create-liquidity',
  },
  {
    id: 'burn-tokens',
    title: 'Burn Tokens',
    description: 'Permanently remove tokens from circulation with batch operations and detailed reporting.',
    icon: Flame,
    color: 'destructive',
    features: ['Batch Operations', 'Detailed Reports', 'Permanent Removal'],
    highlight: 'Batch Support',
    href: '/tools/burn-tokens',
  },
  {
    id: 'revoke-mint',
    title: 'Revoke Mint Authority',
    description: 'Permanently disable token minting to build trust and ensure fixed supply for your community.',
    icon: Shield,
    color: 'primary',
    features: ['Trust Building', 'Fixed Supply', 'Community Benefits'],
    highlight: 'Build Trust',
    href: '/tools/revoke-mint-authority',
  },
  {
    id: 'revoke-freeze',
    title: 'Revoke Freeze Authority',
    description: 'Remove freeze capabilities to ensure complete decentralization and token freedom.',
    icon: Lock,
    color: 'secondary',
    features: ['Full Decentralization', 'Token Freedom', 'Community Control'],
    highlight: 'Decentralized',
    href: '/tools/revoke-freeze-authority',
  },
  {
    id: 'freeze-accounts',
    title: 'Freeze Accounts',
    description: 'Temporarily disable token accounts for compliance and security with reversible controls.',
    icon: UserX,
    color: 'warning',
    features: ['Compliance Tools', 'Reversible Actions', 'Security Features'],
    highlight: 'Compliance Ready',
    href: '/tools/freeze-accounts',
  },
  {
    id: 'unfreeze-accounts',
    title: 'Unfreeze Accounts',
    description: 'Restore token account functionality and enable transfers after temporary freezing.',
    icon: Unlock,
    color: 'info',
    features: ['Account Recovery', 'Restore Functionality', 'Transfer Re-enable'],
    highlight: 'Recovery Tool',
    href: '/tools/unfreeze-accounts',
  },
  {
    id: 'multisender',
    title: 'Transaction Multisender',
    description: 'Send tokens to multiple addresses simultaneously with optimized batching and cost reduction.',
    icon: Send,
    color: 'info',
    features: ['Batch Optimization', 'Cost Reduction', 'Mass Distribution'],
    highlight: 'Save on Fees',
    href: '/tools/transaction-multisender',
  },
  {
    id: 'token-auditor',
    title: 'Token Auditor',
    description: 'Comprehensive token analysis and security audit with detailed reporting and recommendations.',
    icon: Search,
    color: 'primary',
    features: ['Security Analysis', 'Detailed Reports', 'Risk Assessment'],
    highlight: 'Security First',
    href: '/tools/token-auditor',
  },
]

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const cardVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}
