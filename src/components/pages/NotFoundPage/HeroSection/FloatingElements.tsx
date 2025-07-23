'use client'

import { motion } from 'framer-motion'
import { Shield, Lock } from 'lucide-react'

export const FloatingElements = (): React.ReactNode => (
  <>
    {/* Subtle Floating Elements */}
    <motion.div
      animate={{
        y: [0, -8, 0],
        opacity: [0.6, 1, 0.6],
      }}
      className='bg-primary/20 absolute -top-4 -right-8 flex h-6 w-6 items-center justify-center rounded-full'
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Shield className='text-primary h-3 w-3' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, 6, 0],
        opacity: [0.5, 0.8, 0.5],
      }}
      className='bg-secondary/20 absolute -bottom-2 -left-8 flex h-5 w-5 items-center justify-center rounded-full'
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      }}
    >
      <Lock className='text-secondary h-2.5 w-2.5' />
    </motion.div>

    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      className='bg-warning/30 absolute top-1/2 -left-12 h-4 w-4 rounded-full'
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    />
  </>
)
