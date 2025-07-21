'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingDown, Users, Lock, type LucideIcon } from 'lucide-react'

interface BurnReason {
  icon: LucideIcon
  title: string
  description: string
}

const burnReasons: BurnReason[] = [
  {
    icon: TrendingDown,
    title: 'Reduce Supply',
    description: 'Decrease total token supply to increase scarcity',
  },
  {
    icon: Users,
    title: 'Community Trust',
    description: 'Demonstrate commitment to tokenomics and community',
  },
  {
    icon: Lock,
    title: 'Deflationary Mechanics',
    description: 'Implement deflationary features in your token economy',
  },
]

export const BurnReasons = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='grid grid-cols-1 gap-6 md:grid-cols-3'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.7, duration: 0.8 }}
  >
    {burnReasons.map((reason, index) => {
      const Icon = reason.icon
      return (
        <motion.div className='text-center' key={index} whileHover={{ scale: 1.02 }}>
          <Card className='hover:border-primary/30 border-2 transition-all duration-300'>
            <CardContent className='p-6'>
              <Icon className='text-primary mx-auto mb-3 h-8 w-8' />
              <h4 className='mb-2 font-medium'>{reason.title}</h4>
              <p className='text-muted-foreground text-sm'>{reason.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      )
    })}
  </motion.div>
)
