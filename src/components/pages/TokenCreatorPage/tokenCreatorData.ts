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
    description: 'Full Token-2022 compatibility with all modern features',
    highlight: 'Token-2022',
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
