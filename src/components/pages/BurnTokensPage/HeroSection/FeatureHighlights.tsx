'use client'

import { motion } from 'framer-motion'
import { FeatureCard } from '@/components/common'
import { DollarSign, Sparkles, Shield, Eye, Code, type LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: DollarSign,
    title: 'Lowest fees on the market',
    description: 'Just 0.02 SOL platform fee + network costs',
  },
  {
    icon: Sparkles,
    title: 'Batch burning support',
    description: 'Burn multiple token amounts in a single transaction',
  },
  {
    icon: Shield,
    title: 'Safe & secure operations',
    description: 'Built-in safeguards and confirmation steps',
  },
  {
    icon: Eye,
    title: 'Privacy-first: no tracking',
    description: 'No cookies, no analytics, no personal data stored',
  },
  {
    icon: Code,
    title: 'Simulation/devnet support',
    description: 'Test your burns safely before mainnet execution',
  },
]

export const FeatureHighlights = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.5, duration: 0.8 }}
  >
    {features.map((feature, index) => (
      <FeatureCard feature={feature} index={index} key={index} size='compact' variant='destructive' />
    ))}
  </motion.div>
)
