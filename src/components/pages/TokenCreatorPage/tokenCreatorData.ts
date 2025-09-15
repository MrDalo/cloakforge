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
    description: 'Just 0.19 SOL platform fee + network costs',
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
    icon: Zap,
    title: 'One-click deployment',
    description: 'Create and deploy your token instantly with our streamlined process',
  },
]

export const valueProps: ValueProp[] = [
  {
    icon: DollarSign,
    title: 'Lowest fees',
    description: 'Transparent pricing with no hidden costs',
    highlight: '0.19 SOL',
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
    icon: Zap,
    title: 'One-click deployment',
    description: 'Create and deploy your token instantly',
    highlight: 'Instant creation',
  },
  {
    icon: Code,
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
  revokeFreezeAuthority: boolean
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
  revokeFreezeAuthority: false,
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
  revokeFreezeAuthority: boolean = false,
  baseFee: number = 0.1,
  networkFee: number = 0.01
): FeeCalculation => {
  // Add 0.05 SOL for each authority revocation
  const authorityFees = (revokeMintAuthority ? 0.05 : 0) + (revokeFreezeAuthority ? 0.05 : 0)

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
