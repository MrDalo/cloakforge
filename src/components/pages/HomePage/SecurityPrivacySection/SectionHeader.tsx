'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export const SectionHeader = (): React.ReactNode => (
  <motion.div
    className='mb-16 text-center'
    initial={{ opacity: 0, y: 30 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <motion.div
      className='bg-secondary/10 text-secondary mb-6 inline-flex items-center rounded-full px-4 py-2'
      initial={{ opacity: 0, scale: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, scale: 1 }}
    >
      <Shield className='mr-2 h-4 w-4' />
      <span className='text-sm'>Security & Privacy</span>
    </motion.div>

    <h2 className='mb-6 text-3xl md:text-5xl'>
      Your Privacy & Security
      <span className='privacy-text-gradient block'>Are Our Priority</span>
    </h2>
    <p className='text-muted-foreground mx-auto max-w-3xl text-xl'>
      We believe in transparency about our data practices. Minimal data: no accounts, no analytics, no ad trackers. Wallet activity is
      public on-chain.
    </p>
  </motion.div>
)
