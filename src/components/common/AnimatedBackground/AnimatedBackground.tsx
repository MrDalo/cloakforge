'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'

interface AnimatedBackgroundProps {
  variant?: 'primary' | 'destructive'
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ variant = 'primary' }) => {
  const colorClasses =
    variant === 'destructive' ?
      {
        icon: 'text-destructive/40',
        border: 'border-destructive/20',
        bg: 'bg-destructive/10',
      }
    : {
        icon: 'text-primary/40',
        border: 'border-primary/20',
        bg: 'bg-primary/10',
      }

  return (
    <div className='absolute inset-0 overflow-hidden'>
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          rotate: [0, 180, 360],
        }}
        className={`${colorClasses.border} absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-full border-2`}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <Wallet className={`${colorClasses.icon} h-6 w-6`} />
      </motion.div>

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        className={`${colorClasses.bg} absolute right-1/4 bottom-20 h-32 w-32 rounded-full blur-xl`}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </div>
  )
}

export default AnimatedBackground
