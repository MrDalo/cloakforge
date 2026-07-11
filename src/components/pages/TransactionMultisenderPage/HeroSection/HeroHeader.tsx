'use client'

import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

const HeroHeader = (): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='mb-12 text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className='bg-info/70 text-info-foreground mb-6 inline-flex items-center rounded-full px-4 py-2'
      initial={{ opacity: 0, scale: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Send className='mr-2 h-4 w-4' />
      <span className='text-sm'>Transaction Multisender</span>
    </motion.div>

    <motion.h1
      animate={{ opacity: 1, y: 0 }}
      className='mb-6 text-3xl leading-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.3, duration: 0.8 }}
    >
      Solana <span className='text-info-foreground/90'>Transaction</span> Multisender
    </motion.h1>

    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.4, duration: 0.8 }}
    >
      Send tokens to multiple recipients in optimized batch transactions. Save up to 90% on fees with our advanced batch processing system.
    </motion.p>
  </motion.div>
)

export default HeroHeader
