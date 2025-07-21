'use client'

import { motion } from 'framer-motion'
import { Coins, Droplets } from 'lucide-react'

export const BackgroundElements = (): React.ReactNode => (
  <div className='absolute inset-0 overflow-hidden'>
    {/* Subtle crypto elements */}
    <motion.div
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        rotate: [0, 180, 360],
      }}
      className='border-primary/20 absolute top-20 left-20 flex h-20 w-20 items-center justify-center rounded-full border-2'
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      <Coins className='text-primary/40 h-8 w-8' />
    </motion.div>

    <motion.div
      animate={{
        x: [0, -80, 0],
        y: [0, 100, 0],
        rotate: [0, -180, -360],
      }}
      className='bg-secondary/10 border-secondary/20 absolute top-40 right-32 flex h-16 w-16 items-center justify-center rounded-lg border'
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
    >
      <Droplets className='text-secondary/40 h-8 w-8' />
    </motion.div>

    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      className='bg-primary/10 absolute bottom-20 left-1/4 h-32 w-32 rounded-full blur-xl'
      transition={{ duration: 4, repeat: Infinity }}
    />
  </div>
)
