import { Shield, Zap, Users, Globe, TrendingUp, Star } from 'lucide-react'

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
    description: 'Military-grade encryption and multi-signature support for maximum asset protection.',
    benefits: ['Multi-signature wallets', 'Hardware wallet integration', 'Audit trail for all transactions', 'Smart contract security'],
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
    icon: Users,
    title: 'Collaborative Control',
    description: 'Team-based management with granular permission controls and governance.',
    benefits: ['Role-based access control', 'Multi-user approval workflows', 'Team activity monitoring', 'Governance token integration'],
    gradient: 'from-purple-500 to-pink-500',
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
  { label: 'Uptime Guarantee', value: '99.5%', icon: TrendingUp },
  { label: 'Tools Available', value: '7+', icon: Zap },
  { label: 'Solana Network', value: '100%', icon: Star },
  { label: 'Zero Data Collection', value: '100%', icon: Shield },
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
