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
    title: 'Low, transparent fees',
    description: 'Just 0.009 SOL platform fee + network costs',
  },
  {
    icon: Sparkles,
    title: 'Precise amount control',
    description: 'Burn exact token amounts with decimal precision',
  },
  {
    icon: Shield,
    title: 'Safe & secure operations',
    description: 'Built-in safeguards and confirmation steps',
  },
  {
    icon: Eye,
    title: 'Privacy-first: no tracking',
    description: 'No account needed, no analytics, no ad trackers',
  },
  {
    icon: Code,
    title: 'Balance validation',
    description: 'Pre-flight checks ensure sufficient token balance',
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
