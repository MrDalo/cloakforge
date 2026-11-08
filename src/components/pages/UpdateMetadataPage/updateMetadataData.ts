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
    title: 'Low, transparent fees',
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
    description: 'No account needed, no analytics, no ad trackers',
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
    title: 'Low, transparent fees',
    description: 'Transparent pricing with no hidden costs',
    highlight: 'Low cost',
  },
  {
    icon: Shield,
    title: 'Privacy-focused',
    description: 'Minimal data: no accounts, no analytics, no ad trackers',
    highlight: 'Minimal data',
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
