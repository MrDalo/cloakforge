'use client'

import { motion } from 'framer-motion'
import { Home, ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ErrorActionButtonsProps {
  onTryAgain?: () => void
  onGoBack?: () => void
}

export const ErrorActionButtons = ({ onTryAgain, onGoBack }: ErrorActionButtonsProps): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='mb-16 flex flex-col justify-center gap-4 sm:flex-row'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.7, duration: 0.8 }}
  >
    <Button className='group bg-primary hover:bg-primary-hover relative overflow-hidden' onClick={onTryAgain} size='lg'>
      <RotateCcw className='mr-2 h-5 w-5 transition-transform group-hover:rotate-180' />
      Try Again
      <motion.div
        className='absolute inset-0 bg-white/20'
        initial={{ x: '-100%' }}
        transition={{ duration: 0.5 }}
        whileHover={{ x: '100%' }}
      />
    </Button>

    <Button className='group bg-primary hover:bg-primary-hover relative overflow-hidden' size='lg'>
      <Link className='flex items-center' href='/'>
        <Home className='mr-2 h-5 w-5 transition-transform group-hover:scale-110' />
        Back to Home
        <motion.div
          className='absolute inset-0 bg-white/20'
          initial={{ x: '-100%' }}
          transition={{ duration: 0.5 }}
          whileHover={{ x: '100%' }}
        />
      </Link>
    </Button>

    <Button className='group border-primary/20 hover:border-primary/40 border-2' onClick={onGoBack} size='lg' variant='outline'>
      <ArrowLeft className='mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1' />
      Go Back
    </Button>
  </motion.div>
)
