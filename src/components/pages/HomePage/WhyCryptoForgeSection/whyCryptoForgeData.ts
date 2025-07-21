import { Shield, Zap, Lock, Globe } from 'lucide-react'

export interface Benefit {
  icon: typeof Shield
  title: string
  description: string
  details: string[]
  color: 'primary' | 'secondary'
}

export interface ComparisonRow {
  feature: string
  traditional: string
  cryptoForge: string
  benefit: string
}

export const benefits: Benefit[] = [
  {
    icon: Shield,
    title: 'Self-Sovereign Control',
    description: 'Maintain full control over your assets and transactions without intermediaries.',
    details: ['Direct wallet interaction', 'No third-party custody', 'Full transaction control'],
    color: 'primary',
  },
  {
    icon: Zap,
    title: 'No Registration Required',
    description: 'Start using our tools immediately with just your wallet — no lengthy onboarding.',
    details: ['Instant access with wallet', 'No account verification', 'Start building right away'],
    color: 'secondary',
  },
  {
    icon: Globe,
    title: 'Global Accessibility',
    description: 'Access professional-grade tools from anywhere in the world, anytime.',
    details: ['No geographic restrictions', 'Works globally 24/7', 'Permissionless access'],
    color: 'primary',
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    description: "Built with privacy-first principles — we don't collect unnecessary data.",
    details: ['Minimal data collection', 'On-chain transactions only', 'No behavioral tracking'],
    color: 'secondary',
  },
]

export const comparisonData: ComparisonRow[] = [
  {
    feature: 'Getting Started',
    traditional: 'Account setup & KYC',
    cryptoForge: 'Connect wallet',
    benefit: 'Instant access',
  },
  {
    feature: 'Data Requirements',
    traditional: 'Personal information',
    cryptoForge: 'Wallet address only',
    benefit: 'Privacy protection',
  },
  {
    feature: 'Access Control',
    traditional: 'Platform dependent',
    cryptoForge: 'Self-sovereign',
    benefit: 'True ownership',
  },
  {
    feature: 'Transaction Fees',
    traditional: 'Platform + network',
    cryptoForge: 'Network only + minimal fees',
    benefit: 'Lower costs',
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
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
}
