'use client'

import { motion } from 'framer-motion'
import { stats } from './heroData'

export const TrustIndicators = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='border-border mt-12 grid grid-cols-3 gap-6 border-t pt-8'
    initial={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.8, duration: 0.8 }}
  >
    {stats.map((stat, index) => (
      <div className='text-center' key={index}>
        <div className='crypto-text-gradient mb-1 text-2xl md:text-3xl'>{stat.value}</div>
        <div className='text-muted-foreground text-sm'>{stat.label}</div>
      </div>
    ))}
  </motion.div>
)
