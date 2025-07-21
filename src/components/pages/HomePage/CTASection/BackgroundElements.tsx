'use client'

import { motion } from 'framer-motion'
import { Coins, Zap } from 'lucide-react'

export const BackgroundElements = (): React.ReactNode => (
  <div className='absolute inset-0 overflow-hidden'>
    <motion.div
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        rotate: [0, 360],
      }}
      className='border-primary/20 absolute top-10 left-10 flex h-32 w-32 items-center justify-center rounded-full border'
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      <Coins className='text-primary/30 h-12 w-12' />
    </motion.div>
    <motion.div
      animate={{
        x: [0, -80, 0],
        y: [0, 80, 0],
        rotate: [0, -360],
      }}
      className='bg-secondary/10 absolute right-10 bottom-10 flex h-24 w-24 items-center justify-center rounded-lg'
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
    >
      <Zap className='text-secondary/30 h-8 w-8' />
    </motion.div>
  </div>
)
