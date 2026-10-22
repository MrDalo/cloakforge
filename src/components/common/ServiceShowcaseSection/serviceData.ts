import { Coins, Droplets, Flame, Shield, PenOff, Lock, UserX, Send, Search, RefreshCw, Pencil } from 'lucide-react'

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
    description: 'Launch professional Token-2022 tokens with custom metadata, supply controls, and advanced features.',
    icon: Coins,
    color: 'primary',
    features: ['Custom Metadata', 'Supply Control', 'Advanced Features'],
    highlight: 'Most Popular',
    href: '/tools/token-creator',
  },
  {
    id: 'liquidity-provider',
    title: 'Liquidity Provider',
    description: 'Create and manage Raydium pools with optimized routing and minimal slippage.',
    icon: Droplets,
    color: 'secondary',
    features: ['DEX Integration', 'Optimal Routing', 'Minimal Slippage'],
    highlight: 'Fast & Efficient',
    href: '/tools/liquidity-provider',
  },
  {
    id: 'burn-tokens',
    title: 'Burn Tokens',
    description: 'Permanently remove tokens from circulation with low, transparent fees and built-in confirmation steps.',
    icon: Flame,
    color: 'destructive',
    features: ['Low, transparent fees', 'Secure Operations', 'Permanent Removal'],
    highlight: 'Transparent fees',
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
    id: 'revoke-metadata-authority',
    title: 'Revoke Metadata Authority',
    description: 'Permanently lock token metadata to prevent any future changes to name, symbol, or image.',
    icon: PenOff,
    color: 'primary',
    features: ['Trust Building', 'Immutable Metadata', 'Community Confidence'],
    highlight: 'Lock It In',
    href: '/tools/revoke-metadata-authority',
  },
  {
    id: 'update-metadata',
    title: 'Update Token Metadata',
    description: 'Update your token name, symbol, image, and social links while you still hold update authority.',
    icon: Pencil,
    color: 'secondary',
    features: ['Rebrand Anytime', 'IPFS Storage', 'Social Links'],
    highlight: 'Stay Flexible',
    href: '/tools/update-metadata',
  },
  {
    id: 'freeze-wallets',
    title: 'Freeze Wallets',
    description: 'Temporarily disable token wallets for compliance and security with reversible controls.',
    icon: UserX,
    color: 'warning',
    features: ['Compliance Tools', 'Reversible Actions', 'Security Features'],
    highlight: 'Compliance Ready',
    href: '/tools/freeze-wallets',
  },
  {
    id: 'unfreeze-wallets',
    title: 'Unfreeze Wallets',
    description: 'Restore token wallet functionality and enable transfers after temporary freezing.',
    icon: RefreshCw,
    color: 'info',
    features: ['Wallet Recovery', 'Restore Functionality', 'Transfer Re-enable'],
    highlight: 'Recovery Tool',
    href: '/tools/unfreeze-wallets',
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
