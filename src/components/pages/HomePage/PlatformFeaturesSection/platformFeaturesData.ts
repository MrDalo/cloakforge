import { Shield, Zap, Globe, TrendingUp, Star } from 'lucide-react'

export interface Feature {
  icon: typeof Shield
  title: string
  description: string
  benefits: string[]
  gradient: string
}

export interface Stat {
  label: string
  value: string
  icon: typeof TrendingUp
}

export interface TimelineStep {
  step: string
  title: string
  description: string
}

export const timelineData: TimelineStep[] = [
  {
    step: '01',
    title: 'Connect Wallet',
    description: 'Securely connect your Solana wallet with one click. No accounts or signups required.',
  },
  {
    step: '02',
    title: 'Configure Token',
    description: 'Set your token parameters including name, symbol, supply, and metadata with our intuitive interface.',
  },
  {
    step: '03',
    title: 'Deploy & Launch',
    description: 'Deploy your token to the Solana blockchain instantly and start managing your digital asset.',
  },
]

export const features: Feature[] = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Non-custodial design and wallet adapter integration for maximum asset protection.',
    benefits: ['Direct wallet interaction', 'No private key storage', 'Transaction transparency', 'Open source validation'],
    gradient: 'from-primary to-primary-active',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: "Built on Solana's high-performance blockchain for instant transactions.",
    benefits: ['Sub-second transaction times', 'Low network fees', 'Batch transaction optimization', 'Real-time updates'],
    gradient: 'from-secondary to-green-400',
  },
  {
    icon: Globe,
    title: 'Global Accessibility',
    description: 'Access your tools from anywhere with our responsive, web-based platform.',
    benefits: ['Cross-platform compatibility', 'Mobile-optimized interface', 'Offline transaction signing', '24/7 availability'],
    gradient: 'from-blue-500 to-cyan-400',
  },
]

export const stats: Stat[] = [
  { label: 'Accounts Required', value: 'None', icon: TrendingUp },
  { label: 'Tools Available', value: '9+', icon: Zap },
  { label: 'Solana Network', value: '100%', icon: Star },
  { label: 'Ad Trackers', value: 'None', icon: Shield },
]

export const timelineSteps: TimelineStep[] = [
  {
    step: '01',
    title: 'Connect & Create',
    description: 'Connect your wallet and create tokens with custom parameters in minutes.',
  },
  {
    step: '02',
    title: 'Manage & Control',
    description: 'Use our suite of tools to manage supply, liquidity, and token authorities.',
  },
  {
    step: '03',
    title: 'Scale & Grow',
    description: 'Distribute tokens, manage communities, and build your ecosystem at scale.',
  },
]
