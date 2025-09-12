'use client'
import { motion } from 'framer-motion'
import React from 'react'

const LoadingSpinner = (): React.ReactNode => (
  <div className='relative flex items-center justify-center'>
    <motion.div
      animate={{ rotate: 360 }}
      className='border-primary/20 border-t-primary size-12 rounded-full border-4'
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </div>
)

export default LoadingSpinner
