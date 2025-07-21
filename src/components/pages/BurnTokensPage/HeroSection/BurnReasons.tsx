'use client'

import { motion } from 'framer-motion'
import { SimpleCard } from '@/components/common'
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
    {burnReasons.map((reason, index) => (
      <SimpleCard
        description={reason.description}
        icon={reason.icon}
        index={index}
        key={index}
        size='compact'
        title={reason.title}
        variant='primary'
      />
    ))}
  </motion.div>
)
