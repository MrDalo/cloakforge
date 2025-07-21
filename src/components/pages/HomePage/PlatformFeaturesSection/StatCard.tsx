'use client'

import { motion } from 'framer-motion'
import type { Stat } from './platformFeaturesData'

interface StatCardProps {
  stat: Stat
  index: number
}

export const StatCard = ({ stat, index }: StatCardProps): React.ReactNode => {
  const Icon = stat.icon

  return (
    <motion.div
      className='group text-center'
      initial={{ opacity: 0, scale: 0.5 }}
      transition={{ delay: 0.1 * index, duration: 0.5 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, scale: 1 }}
    >
      <motion.div
        className='bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300'
        whileHover={{ scale: 1.1 }}
      >
        <Icon className='text-primary h-6 w-6' />
      </motion.div>
      <div className='text-primary mb-2 text-3xl'>{stat.value}</div>
      <div className='text-muted-foreground text-sm'>{stat.label}</div>
    </motion.div>
  )
}
