'use client'

import { motion } from 'framer-motion'
import { Snowflake, Shield, Lock, AlertTriangle } from 'lucide-react'

const BackgroundElements = (): React.ReactNode => (
  <>
    {/* Floating Icons */}
    <motion.div
      animate={{
        y: [0, -10, 0],
        opacity: [0.4, 0.7, 0.4],
      }}
      className='bg-info/60 absolute top-20 left-10 flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Snowflake className='text-warning-foreground h-6 w-6' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, 12, 0],
        opacity: [0.3, 0.6, 0.3],
      }}
      className='bg-warning/60 absolute top-32 right-16 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      }}
    >
      <Shield className='text-warning-foreground h-5 w-5' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, -8, 0],
        opacity: [0.5, 0.8, 0.5],
      }}
      className='bg-warning/60 absolute bottom-20 left-20 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    >
      <Lock className='text-warning-foreground h-5 w-5' />
    </motion.div>

    {/* Floating Icons */}
    <motion.div
      animate={{
        y: [0, -10, 0],
        opacity: [0.4, 0.7, 0.4],
      }}
      className='bg-info/60 absolute top-20 left-10 flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Snowflake className='text-info-foreground h-6 w-6' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, 12, 0],
        opacity: [0.3, 0.6, 0.3],
      }}
      className='bg-info/60 absolute top-32 right-16 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      }}
    >
      <Shield className='text-info-foreground h-5 w-5' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, -8, 0],
        opacity: [0.5, 0.8, 0.5],
      }}
      className='bg-info/60 absolute bottom-20 left-20 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    >
      <Lock className='text-info-foreground h-5 w-5' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, 15, 0],
        opacity: [0.2, 0.5, 0.2],
      }}
      className='bg-info/60 absolute right-12 bottom-32 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 4.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1.5,
      }}
    >
      <AlertTriangle className='text-info-foreground h-4 w-4' />
    </motion.div>

    {/* Gradient Overlays */}
    <div className='from-background via-background/90 absolute inset-0 bg-gradient-to-b to-transparent' />
    <div className='from-info/5 to-info/5 absolute inset-0 bg-gradient-to-r via-transparent' />

    {/* Gradient Overlays */}
    <div className='from-background via-background/90 absolute inset-0 bg-gradient-to-b to-transparent' />
    <div className='from-warning/5 to-warning/5 absolute inset-0 bg-gradient-to-r via-transparent' />
  </>
)

export default BackgroundElements
