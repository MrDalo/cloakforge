'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const LoadingSpinner = (): React.ReactNode => (
  <div className='relative flex items-center justify-center'>
    <motion.div
      animate={{ rotate: 360 }}
      className='border-primary/20 border-t-primary size-12 rounded-full border-4'
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </div>
)

const Loading = (): React.ReactNode => (
  <div className='bg-background relative flex min-h-screen items-center justify-center overflow-hidden'>
    <div className='relative z-10 w-full max-w-md px-6'>
      <Card className='border-border/50 bg-card/80 shadow-2xl backdrop-blur-xl'>
        <CardContent className='p-8 text-center'>
          <div className='bg-primary/10 text-primary border-primary/20 mx-auto mb-6 flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium'>
            <Loader2 className='mr-2 h-3 w-3 animate-spin' />
            Loading
          </div>

          <div className='mb-6'>
            <LoadingSpinner />
          </div>

          <h3 className='mb-3 text-xl font-semibold'>Please wait</h3>
          <p className='text-muted-foreground text-sm leading-relaxed'>We&apos;re preparing everything for you</p>
        </CardContent>
      </Card>

      <div className='text-muted-foreground mt-6 text-center text-xs'>
        <div className='flex items-center justify-center space-x-2'>
          <Shield className='h-3 w-3' />
          <span>Your privacy is protected • No data collected</span>
        </div>
      </div>
    </div>
  </div>
)

export default Loading
