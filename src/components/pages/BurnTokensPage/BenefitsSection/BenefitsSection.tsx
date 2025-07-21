'use client'

import { motion } from 'framer-motion'
import { InfoCard } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Shield, Zap, Lock, TrendingDown, Users, type LucideIcon } from 'lucide-react'

interface WhyChooseFeature {
  icon: LucideIcon
  title: string
  description: string
  badge?: string
}

const features: WhyChooseFeature[] = [
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Built with industry-standard security practices and thoroughly tested smart contracts',
  },
  {
    icon: Zap,
    title: 'Instant Processing',
    description: 'Fast transaction processing on Solana network with minimal fees',
  },
  {
    icon: Lock,
    title: 'Permanent & Irreversible',
    description: 'Tokens are permanently removed from circulation with cryptographic proof',
  },
  {
    icon: TrendingDown,
    title: 'Supply Control',
    description: 'Precise control over token economics and deflationary mechanisms',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Open-source platform trusted by thousands of token creators',
  },
]

export const BenefitsSection = (): React.ReactNode => (
  <section className='container mx-auto px-4 py-16'>
    <motion.div animate={{ opacity: 1, y: 0 }} className='text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
      <Badge className='mb-4' variant='outline'>
        Why Choose Us
      </Badge>
      <h2 className='mb-4 text-3xl font-bold md:text-4xl'>Professional Token Burning Solution</h2>
      <p className='text-muted-foreground mx-auto mb-12 max-w-2xl text-lg'>
        The most trusted and secure platform for burning tokens on Solana. Join thousands of projects that have successfully managed their
        tokenomics.
      </p>
    </motion.div>

    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
      initial={{ opacity: 0, y: 30 }}
      transition={{ delay: 0.3, duration: 0.8 }}
    >
      {features.map((feature, index) => (
        <InfoCard description={feature.description} icon={feature.icon} index={index} key={index} title={feature.title} variant='simple' />
      ))}
    </motion.div>
  </section>
)
