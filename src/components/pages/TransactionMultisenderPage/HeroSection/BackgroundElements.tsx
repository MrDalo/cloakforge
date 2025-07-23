'use client'

import { motion } from 'framer-motion'
import { Send, Users, TrendingUp, Shield } from 'lucide-react'

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
      <Send className='text-info-foreground h-6 w-6' />
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
      <Users className='text-info-foreground h-5 w-5' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, -8, 0],
        opacity: [0.5, 0.8, 0.5],
      }}
      className='bg-info/60 absolute bottom-32 left-20 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    >
      <TrendingUp className='text-info-foreground h-4 w-4' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, 15, 0],
        opacity: [0.4, 0.7, 0.4],
      }}
      className='bg-info/60 absolute right-32 bottom-20 flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 4.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1.5,
      }}
    >
      <Shield className='text-info-foreground h-7 w-7' />
    </motion.div>
  </>
)

export default BackgroundElements
