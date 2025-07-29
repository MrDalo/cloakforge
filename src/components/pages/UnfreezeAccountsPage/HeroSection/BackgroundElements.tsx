'use client'

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

const BackgroundElements = (): React.ReactNode => (
  <div className='absolute inset-0 overflow-hidden'>
    <motion.div
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        rotate: [0, 180, 360],
      }}
      className='border-warning-foreground/40 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-full border-2'
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      <RefreshCw className='text-warning-foreground/40 h-6 w-6' />
    </motion.div>

    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      className='bg-warning absolute right-1/4 bottom-20 h-32 w-32 rounded-full'
      transition={{ duration: 4, repeat: Infinity }}
    />

    <motion.div
      animate={{
        x: [0, -80, 0],
        y: [0, 60, 0],
      }}
      className='bg-warning/40 absolute top-1/2 right-16 h-20 w-20 rounded-lg'
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
)

export default BackgroundElements
