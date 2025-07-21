'use client'

import { motion } from 'framer-motion'

// Background Elements
export const HeroBackground = (): React.ReactNode => (
  <div className='absolute inset-0 overflow-hidden'>
    <motion.div
      animate={{
        x: [0, 80, 0],
        y: [0, -40, 0],
        rotate: [0, 180, 360],
      }}
      className='border-destructive-foreground/30 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-full border-2'
      transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
    >
      <div className='text-destructive-foreground h-6 w-6'>🔥</div>
    </motion.div>

    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      className='bg-destructive/10 absolute right-1/4 bottom-20 h-32 w-32 rounded-full blur-xl'
      transition={{ duration: 4, repeat: Infinity }}
    />
  </div>
)
