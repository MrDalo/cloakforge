'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface HeroHeadingProps {
  title: string
  description?: string
  variant?: 'primary' | 'destructive' | 'info' | 'secondary' | 'warning'
  badgeText?: string
  badgeIcon?: LucideIcon
}

const HeroHeading: React.FC<HeroHeadingProps> = ({ title, description, variant = 'primary', badgeText, badgeIcon: BadgeIcon }) => {
  let colorClasses = 'bg-primary/10 text-primary'
  let titleClass = 'crypto-text-gradient'

  if (variant === 'destructive') {
    colorClasses = 'bg-destructive text-destructive-foreground'
    titleClass = 'from-destructive-foreground/60 bg-linear-to-r to-orange-300 bg-clip-text text-transparent'
  } else if (variant === 'info') {
    colorClasses = 'bg-info/70 text-info-foreground'
    titleClass = 'info-text-gradient'
  } else if (variant === 'secondary') {
    colorClasses = 'bg-secondary/10 text-secondary'
    titleClass = 'from-secondary to-primary bg-linear-to-r bg-clip-text text-transparent'
  } else if (variant === 'warning') {
    colorClasses = 'bg-warning/80 text-warning-foreground'
    titleClass = 'from-warning-foreground bg-linear-to-r to-yellow-200 bg-clip-text text-transparent'
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
      {/* Page Title Badge */}
      {badgeText && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className={`${colorClasses} mb-6 inline-flex items-center rounded-full px-4 py-2`}
          initial={{ opacity: 0, scale: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {BadgeIcon && <BadgeIcon className='mr-2 h-4 w-4' />}
          <span className='text-sm'>{badgeText}</span>
        </motion.div>
      )}

      {/* Main Title */}
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <span className={titleClass}>{title}</span>
      </motion.h1>

      {/* Subtitle */}
      {description && (
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground mx-auto mb-12 max-w-2xl text-lg'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  )
}

export default HeroHeading
