import { Shield, RefreshCw, Eye, Sparkles, DollarSign, type LucideIcon } from 'lucide-react'

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

export const features: Feature[] = [
  {
    icon: DollarSign,
    title: 'Lowest fees on the market',
    description: 'A small platform fee plus network costs — no percentage-based pricing',
  },
  {
    icon: RefreshCw,
    title: 'Update anytime',
    description: 'Change name, symbol, logo, and social links whenever your project evolves',
  },
  {
    icon: Shield,
    title: 'Authority-gated',
    description: 'Only the wallet holding metadata update authority can make changes',
  },
  {
    icon: Eye,
    title: 'Privacy-first: no tracking',
    description: 'No cookies, no analytics, no personal data stored',
  },
  {
    icon: Sparkles,
    title: 'Smart re-uploads',
    description: 'Only re-uploads to IPFS and writes on-chain fields that actually changed',
  },
]

export const valueProps: ValueProp[] = [
  {
    icon: DollarSign,
    title: 'Lowest fees',
    description: 'Transparent pricing with no hidden costs',
    highlight: 'Low cost',
  },
  {
    icon: Shield,
    title: 'Privacy-focused',
    description: 'No tracking, no data collection, fully anonymous',
    highlight: 'Zero tracking',
  },
  {
    icon: RefreshCw,
    title: 'Flexible updates',
    description: 'Rebrand or refresh your token metadata whenever you need to',
    highlight: 'Always editable',
  },
  {
    icon: Sparkles,
    title: 'Smart re-uploads',
    description: 'Only touches IPFS and on-chain fields that actually changed',
    highlight: 'Efficient',
  },
]
