import { Shield, Zap, Eye, Code, DollarSign, Sparkles, type LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export interface FAQ {
  question: string
  answer: string
}

export interface ValueProp {
  icon: LucideIcon
  title: string
  description: string
  highlight: string
}

export interface FormData {
  name: string
  symbol: string
  decimals: number
  supply: string
  description: string
  logoFile: File | null
  makeMetadataImmutable: boolean
  revokeMintAuthority: boolean
  revokeFreezeAuthority: boolean
  website: string
  twitter: string
  telegram: string
}

export interface AuthorityControl {
  key: keyof FormData
  label: string
  description: string
}

export interface FeeCalculation {
  platform: number
  network: number
  total: number
  originalPrice: number
  savings: number
}

export const features: Feature[] = [
  {
    icon: DollarSign,
    title: 'Lowest fees on the market',
    description: 'Just 0.1 SOL platform fee + network costs',
  },
  {
    icon: Sparkles,
    title: 'Seamless metadata integration',
    description: 'Automatic IPFS upload and JSON metadata creation',
  },
  {
    icon: Shield,
    title: 'Advanced authority management',
    description: 'Full control over mint and freeze authorities',
  },
  {
    icon: Eye,
    title: 'Privacy-first: no tracking',
    description: 'No cookies, no analytics, no personal data stored',
  },
  {
    icon: Code,
    title: 'Simulation/devnet support',
    description: 'Test your tokens safely before mainnet deployment',
  },
]

export const faqData: FAQ[] = [
  {
    question: 'What is an SPL token?',
    answer:
      'SPL (Solana Program Library) tokens are the standard for fungible and non-fungible tokens on Solana. They are similar to ERC-20 tokens on Ethereum but with faster transactions and lower fees.',
  },
  {
    question: 'What are token authorities?',
    answer:
      'Token authorities control key functions of your token. Mint Authority allows creating new tokens, while Freeze Authority can freeze/unfreeze token accounts. Revoking these authorities makes your token more decentralized.',
  },
  {
    question: 'Can I create tokens on devnet first?',
    answer:
      'Yes! We highly recommend testing your token creation on devnet first. This allows you to verify everything works correctly before deploying to mainnet with real SOL.',
  },
  {
    question: 'What happens to my token metadata?',
    answer:
      'Your token metadata (name, symbol, description, logo) is uploaded to IPFS for permanent, decentralized storage. The metadata URI is then linked to your token.',
  },
  {
    question: 'Are there any ongoing fees?',
    answer:
      'No ongoing fees! You only pay once when creating the token: our platform fee (0.1 SOL) plus standard Solana network fees (~0.01 SOL). No monthly subscriptions or hidden costs.',
  },
  {
    question: 'Can I modify my token after creation?',
    answer:
      'Some aspects can be modified if you retain the proper authorities. However, making metadata immutable during creation ensures permanence and increases trust.',
  },
  {
    question: 'How do I add liquidity after creating my token?',
    answer:
      'After creating your token, you can use our Create Liquidity tool or manually add liquidity on DEXs like Raydium, Orca, or Jupiter.',
  },
  {
    question: 'What file formats are supported for logos?',
    answer:
      'We support PNG, JPG, and SVG formats. Recommended size is 512x512 pixels for optimal display across all platforms and wallets.',
  },
]

export const valueProps: ValueProp[] = [
  {
    icon: DollarSign,
    title: 'Lowest fees',
    description: 'Transparent pricing with no hidden costs',
    highlight: '0.1 SOL',
  },
  {
    icon: Shield,
    title: 'Privacy-focused',
    description: 'No tracking, no data collection, fully anonymous',
    highlight: 'Zero tracking',
  },
  {
    icon: Sparkles,
    title: 'Advanced token features',
    description: 'Full SPL-2022 compatibility with all modern features',
    highlight: 'SPL-2022',
  },
  {
    icon: Code,
    title: 'Devnet simulation',
    description: 'Test thoroughly before mainnet deployment',
    highlight: 'Test first',
  },
  {
    icon: Zap,
    title: 'No coding needed',
    description: 'User-friendly interface for technical and non-technical users',
    highlight: 'One-click',
  },
]

export const authorityControls: AuthorityControl[] = [
  {
    key: 'makeMetadataImmutable',
    label: 'Make Metadata Immutable',
    description: 'Prevents any future changes to token metadata',
  },
  {
    key: 'revokeMintAuthority',
    label: 'Revoke Mint Authority',
    description: 'Prevents creation of additional tokens (recommended for fixed supply)',
  },
  {
    key: 'revokeFreezeAuthority',
    label: 'Revoke Freeze Authority',
    description: 'Removes ability to freeze token accounts (increases decentralization)',
  },
]

export interface TokenFormData {
  name: string
  symbol: string
  description: string
  totalSupply: string
  decimals: string
  revokeMintAuthority: boolean
  revokeUpdateAuthority: boolean
  website: string
  twitter: string
  telegram: string
  discord: string
}

export interface FeeCalculation {
  platform: number
  network: number
  authorityFees: number
  total: number
  originalPrice: number
  savings: number
}

export const initialFormData: TokenFormData = {
  name: '',
  symbol: '',
  description: '',
  totalSupply: '1000000',
  decimals: '9',
  revokeMintAuthority: false,
  revokeUpdateAuthority: false,
  website: '',
  twitter: '',
  telegram: '',
  discord: '',
}

export const heroData = {
  title: 'Solana Token Creator',
  subtitle: 'Create your own SPL token in minutes',
  description: 'Launch your custom token on Solana with our intuitive creator tool. No coding required.',
}

export const calculateFees = (
  revokeMintAuthority: boolean = false,
  revokeUpdateAuthority: boolean = false,
  baseFee: number = 0.1,
  networkFee: number = 0.01
): FeeCalculation => {
  // Add 0.05 SOL for each authority revocation
  const authorityFees = (revokeMintAuthority ? 0.05 : 0) + (revokeUpdateAuthority ? 0.05 : 0)

  const total = baseFee + networkFee + authorityFees

  return {
    platform: baseFee,
    network: networkFee,
    authorityFees,
    total,
    originalPrice: total + 0.05,
    savings: 0.05,
  }
}
