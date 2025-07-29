'use client'

import { motion } from 'framer-motion'
import { ScanEye } from 'lucide-react'

const HeroHeader = (): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='mb-12 text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
      initial={{ opacity: 0, scale: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <ScanEye className='mr-2 h-4 w-4' />
      <span className='text-sm'>Token Auditor</span>
    </motion.div>

    <motion.h1
      animate={{ opacity: 1, y: 0 }}
      className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.3, duration: 0.8 }}
    >
      <span className='crypto-text-gradient'>Solana Token Auditor</span>
    </motion.h1>

    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.4, duration: 0.8 }}
    >
      Comprehensive security analysis and real-time data for any Solana SPL token. Get instant insights on authority status, holder
      distribution, and potential risks.
    </motion.p>
  </motion.div>
)

export default HeroHeader
