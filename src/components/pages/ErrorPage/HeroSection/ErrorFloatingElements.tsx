'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Zap } from 'lucide-react'

export const ErrorFloatingElements = (): React.ReactNode => (
  <>
    {/* Floating Elements for Error Page */}
    <motion.div
      animate={{
        y: [0, -8, 0],
        opacity: [0.6, 1, 0.6],
      }}
      className='absolute -top-4 -right-8 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20'
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <AlertTriangle className='h-3 w-3 text-red-500' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, 6, 0],
        opacity: [0.5, 0.8, 0.5],
      }}
      className='absolute -bottom-2 -left-8 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20'
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      }}
    >
      <Zap className='h-2.5 w-2.5 text-orange-500' />
    </motion.div>

    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      className='absolute top-1/2 -left-12 h-4 w-4 rounded-full bg-yellow-500/30'
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    />
  </>
)
