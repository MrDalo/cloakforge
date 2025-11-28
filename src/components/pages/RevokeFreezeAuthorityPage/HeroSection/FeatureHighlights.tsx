'use client'

import { motion } from 'framer-motion'
import { DollarSign, Shield, Sparkles, Eye, Code } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: DollarSign,
    title: 'Lowest fees on the market',
    description: 'Just 0.1 SOL platform fee + network costs',
  },
  {
    icon: Shield,
    title: 'Build ultimate trust',
    description: 'Permanently give up freeze control to your community',
  },
  {
    icon: Sparkles,
    title: 'Instant execution',
    description: 'Revoke freeze authority in a single transaction',
  },
  {
    icon: Eye,
    title: 'Privacy-first: no tracking',
    description: 'No cookies, no analytics, no personal data stored',
  },
  {
    icon: Code,
    title: 'Simulation/devnet support',
    description: 'Test your revocation safely before mainnet execution',
  },
]

export const FeatureHighlights = () => (
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
          <Card className='hover:border-secondary/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
            <CardContent className='p-6'>
              <motion.div
                className='bg-secondary/10 group-hover:bg-secondary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300'
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Icon className='text-secondary h-6 w-6' />
              </motion.div>
              <h3 className='group-hover:text-secondary mb-2 font-medium transition-colors duration-300'>{feature.title}</h3>
              <p className='text-muted-foreground text-sm'>{feature.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      )
    })}
  </motion.div>
)
