'use client'

import { motion } from 'framer-motion'
import { Snowflake } from 'lucide-react'

const HeroHeader = (): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='mb-12 text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className='bg-info/70 text-info-foreground mb-6 inline-flex items-center rounded-full px-4 py-2'
      initial={{ opacity: 0, scale: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Snowflake className='mr-2 h-4 w-4' />
      <span className='text-sm'>Account Control</span>
    </motion.div>

    <motion.h1
      animate={{ opacity: 1, y: 0 }}
      className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.3, duration: 0.8 }}
    >
      <span className='info-text-gradient'>Freeze Token Accounts</span>
    </motion.h1>

    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.4, duration: 0.8 }}
    >
      Take immediate control over token accounts. Freeze individual or multiple accounts to prevent unauthorized transactions and enhance
      security.
    </motion.p>
  </motion.div>
)

export default HeroHeader
