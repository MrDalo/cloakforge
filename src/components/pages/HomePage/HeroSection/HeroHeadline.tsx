'use client'

import { motion } from 'framer-motion'

export const HeroHeadline = (): React.ReactNode => (
  <motion.h1
    animate={{ opacity: 1, y: 0 }}
    className='mb-6 text-4xl leading-tight md:text-6xl lg:text-7xl'
    initial={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.3, duration: 0.8 }}
  >
    <span className='from-foreground to-muted-foreground bg-gradient-to-r bg-clip-text text-transparent'>Forge, Manage &</span>
    <br />
    <span className='crypto-text-gradient'>Control Solana Assets</span>
    <br />
    <span className='from-foreground to-muted-foreground bg-gradient-to-r bg-clip-text text-transparent'>Like a Pro</span>
  </motion.h1>
)
