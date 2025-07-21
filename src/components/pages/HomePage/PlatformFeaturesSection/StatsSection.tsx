'use client'

import { motion } from 'framer-motion'
import { StatCard } from './StatCard'
import { stats } from './platformFeaturesData'

export const StatsSection = (): React.ReactNode => (
  <motion.div
    className='bg-card border-border rounded-2xl border-2 p-8 shadow-lg'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.3, duration: 0.8 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <div className='grid grid-cols-2 gap-8 lg:grid-cols-4'>
      {stats.map((stat, index) => (
        <StatCard index={index} key={index} stat={stat} />
      ))}
    </div>
  </motion.div>
)
