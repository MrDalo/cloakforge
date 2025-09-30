'use client'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import React from 'react'

const LoadingSpinner = ({ className }: { className?: string }): React.ReactNode => (
  <div className='relative flex items-center justify-center'>
    <motion.div
      animate={{ rotate: 360 }}
      className={cn('border-primary/20 border-t-primary size-12 rounded-full border-4', className)}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </div>
)

export default LoadingSpinner
