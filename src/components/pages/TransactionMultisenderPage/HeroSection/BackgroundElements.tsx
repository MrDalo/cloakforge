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
      className='bg-info/10 absolute top-20 left-10 flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Send className='text-info-foreground/80 h-6 w-6' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, 12, 0],
        opacity: [0.3, 0.6, 0.3],
      }}
      className='bg-info/20 absolute top-32 right-16 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      }}
    >
      <Users className='text-info-foreground/80 h-5 w-5' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, -8, 0],
        opacity: [0.5, 0.8, 0.5],
      }}
      className='bg-info/15 absolute bottom-32 left-20 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    >
      <TrendingUp className='text-info-foreground/80 h-4 w-4' />
    </motion.div>

    <motion.div
      animate={{
        y: [0, 15, 0],
        opacity: [0.4, 0.7, 0.4],
      }}
      className='bg-info/10 absolute right-32 bottom-20 flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-sm'
      transition={{
        duration: 4.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1.5,
      }}
    >
      <Shield className='text-info-foreground/80 h-7 w-7' />
    </motion.div>

    {/* Floating Orbs */}
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.2, 0.4, 0.2],
      }}
      className='from-info/20 to-info/10 absolute top-16 right-1/4 h-32 w-32 rounded-full bg-gradient-to-r blur-xl'
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />

    <motion.div
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.1, 0.3, 0.1],
      }}
      className='from-info/15 to-info/5 absolute bottom-1/4 left-1/3 h-24 w-24 rounded-full bg-gradient-to-r blur-xl'
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2,
      }}
    />

    {/* Grid Pattern */}
    <div className='bg-[linear-gradient(to_right,_theme(colors.info/5%)_1px,_transparent_1px),_linear-gradient(to_bottom,_theme(colors.info/5%)_1px,_transparent_1px)] absolute inset-0 bg-[size:64px_64px] opacity-30' />

    {/* Gradient Overlays */}
    <div className='from-info/5 to-info/10 absolute inset-0 bg-gradient-to-br via-transparent' />
    <div className='from-background/50 to-background/80 absolute inset-0 bg-gradient-to-tl via-transparent' />
  </>
)

export default BackgroundElements
