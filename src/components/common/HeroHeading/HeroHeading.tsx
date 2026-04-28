'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'

interface HeroHeadingProps {
  title: string
  subtitle?: string
  variant?: 'primary' | 'destructive'
}

const HeroHeading: React.FC<HeroHeadingProps> = ({ title, subtitle, variant = 'primary' }) => {
  const colorClasses = variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-primary/10 text-primary'

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
      {/* Page Title Badge */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className={`${colorClasses} mb-6 inline-flex items-center rounded-full px-4 py-2`}
        initial={{ opacity: 0, scale: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <CreditCard className='mr-2 h-4 w-4' />
        <span className='text-sm'>Account Overview</span>
      </motion.div>

      {/* Main Title */}
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className='mb-6 text-3xl leading-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white'
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {title.split(' ').map((word, i) =>
          i === 1 ? (
            <span className={variant === 'destructive' ? 'text-destructive' : 'text-primary'} key={i}>
              {word}{' '}
            </span>
          ) : (
            <React.Fragment key={i}>{word} </React.Fragment>
          )
        )}
      </motion.h1>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground mx-auto mb-12 max-w-2xl text-lg'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}

export default HeroHeading
