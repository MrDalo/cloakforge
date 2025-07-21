'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
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
    {features.map((feature, index) => {
      const Icon = feature.icon
      return (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='group'
          initial={{ opacity: 0, y: 20 }}
          key={index}
          transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <Card className='hover:border-destructive-foreground/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
            <CardContent className='p-6'>
              <motion.div
                className='bg-destructive/10 group-hover:bg-destructive/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300'
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Icon className='text-destructive-foreground/70 h-6 w-6' />
              </motion.div>
              <h3 className='group-hover:text-destructive-foreground mb-2 font-medium transition-colors duration-300'>{feature.title}</h3>
              <p className='text-muted-foreground text-sm'>{feature.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      )
    })}
  </motion.div>
)
