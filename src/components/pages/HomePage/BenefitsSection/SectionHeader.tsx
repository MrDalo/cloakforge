'use client'

import { motion } from 'framer-motion'
import { Key } from 'lucide-react'

export const SectionHeader = (): React.ReactNode => (
  <motion.div
    className='mb-16 text-center'
    initial={{ opacity: 0, y: 30 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <motion.div
      className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
      initial={{ opacity: 0, scale: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, scale: 1 }}
    >
      <Key className='mr-2 h-4 w-4' />
      <span className='text-sm'>Web3 Advantages</span>
    </motion.div>

    <h2 className='mb-6 text-3xl md:text-5xl'>Why Choose SolCloak?</h2>
    <p className='text-muted-foreground mx-auto max-w-3xl text-xl'>
      Experience the benefits of true Web3 development: instant access, full control, and privacy-respecting tools that work the way you
      expect.
    </p>
  </motion.div>
)
