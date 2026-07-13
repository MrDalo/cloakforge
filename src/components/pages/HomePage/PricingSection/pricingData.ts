import { Calculator, Zap, TrendingDown, Info, CheckCircle, type LucideIcon } from 'lucide-react'

export interface ServiceFee {
  service: string
  icon: LucideIcon
  fee: string
  description: string
  estimatedNetwork: string
  popular: boolean
  isEnabled: boolean
}

export interface FeeComponent {
  component: string
  description: string
  icon: LucideIcon
  color: 'primary' | 'secondary'
}

export interface OptimizationTip {
  tip: string
  description: string
  icon: LucideIcon
}

export const feeBreakdown: FeeComponent[] = [
  {
    component: 'Platform Fee',
    description: 'Fixed fee for using our professional tools',
    icon: Zap,
    color: 'primary',
  },
  {
    component: 'Network Fee',
    description: 'Variable Solana blockchain transaction cost',
    icon: Calculator,
    color: 'secondary',
  },
]

export const costOptimization: OptimizationTip[] = [
  {
    tip: 'Batch Operations',
    description: 'Use multisender for multiple transfers to save on fees',
    icon: TrendingDown,
  },
  {
    tip: 'Off-Peak Usage',
    description: 'Network fees are typically lower during off-peak hours',
    icon: Info,
  },
  {
    tip: 'Bundle Services',
    description: 'Combine multiple operations when possible',
    icon: CheckCircle,
  },
]
