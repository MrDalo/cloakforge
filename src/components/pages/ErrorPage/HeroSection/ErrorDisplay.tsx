'use client'

import { motion } from 'framer-motion'
import { ErrorFloatingElements } from './ErrorFloatingElements'

interface ErrorDisplayProps {
  title?: string
  subtitle?: string
  errorDetails?: {
    message: string
    status?: number
    statusText?: string
    digest?: string
    name: string
  }
}

export const ErrorDisplay = ({
  title = 'Oops! Something Went Wrong',
  subtitle = "An unexpected error occurred while processing your request. Don't worry, your crypto journey continues here.",
  errorDetails,
}: ErrorDisplayProps): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
    {/* Error Display */}
    <div className='relative mb-12'>
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className='relative inline-block'
        initial={{ opacity: 0, scale: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {/* Error Icon/Symbol */}
        <span className='crypto-text-gradient mb-4 block text-8xl leading-none font-bold md:text-9xl lg:text-[12rem]'>⚠️</span>

        <ErrorFloatingElements />
      </motion.div>
    </div>
    {/* Main Heading */}
    <motion.h1
      animate={{ opacity: 1, y: 0 }}
      className='mb-6 text-4xl leading-tight md:text-5xl lg:text-6xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    >
      <span className='from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent'>{title}</span>
    </motion.h1>
    {/* Subtitle */}
    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className='text-muted-foreground mx-auto mb-12 max-w-2xl text-lg md:text-xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.6, duration: 0.8 }}
    >
      {subtitle}
    </motion.p>

    {/* Error Details Section */}
    {errorDetails && (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='text-muted-foreground mx-auto mb-8 max-w-2xl text-sm'
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <details className='cursor-pointer rounded-md border border-gray-200 bg-gray-50 p-4'>
          <summary className='font-medium text-gray-700'>Technical Details</summary>
          <div className='mt-3 space-y-2 text-xs'>
            {errorDetails.status && (
              <div>
                <strong>Status:</strong> {errorDetails.status} {errorDetails.statusText}
              </div>
            )}
            <div>
              <strong>Error Type:</strong> {errorDetails.name}
            </div>
            {errorDetails.message && (
              <div>
                <strong>Message:</strong> {errorDetails.message}
              </div>
            )}
            {errorDetails.digest && (
              <div>
                <strong>Error ID:</strong> {errorDetails.digest}
              </div>
            )}
          </div>
        </details>
      </motion.div>
    )}
  </motion.div>
)
