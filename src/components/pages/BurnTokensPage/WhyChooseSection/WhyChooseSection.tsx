'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
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

export const WhyChooseSection = (): React.ReactNode => (
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
      {features.map((feature, index) => {
        const Icon = feature.icon
        return (
          <motion.div key={index} transition={{ delay: 0.1 * index }} whileHover={{ scale: 1.02 }}>
            <Card className='hover:border-primary/30 h-full border-2 transition-all duration-300'>
              <CardContent className='p-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
                    <Icon className='text-primary h-6 w-6' />
                  </div>
                </div>
                <h3 className='mb-2 text-lg font-semibold'>{feature.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  </section>
)
