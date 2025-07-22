'use client'

import { motion } from 'framer-motion'
import { Scale, Calendar } from 'lucide-react'

export const HeroSection = (): React.ReactNode => (
  <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
    <div className='relative z-10 container mx-auto max-w-4xl'>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mb-12 text-center'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
      >
        {/* Page Badge */}
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
          initial={{ opacity: 0, scale: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Scale className='mr-2 h-4 w-4' />
          <span className='text-sm'>Legal Documentation</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className='mb-6 text-3xl leading-tight md:text-4xl lg:text-5xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className='from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent'>Terms of Service</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Please read these terms carefully before using Crypto Forge. By using our service, you agree to be bound by these terms.
        </motion.p>

        {/* Last Updated */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground flex items-center justify-center space-x-2 text-sm'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <Calendar className='h-4 w-4' />
          <span>Last updated: December 2024</span>
        </motion.div>
      </motion.div>
    </div>
  </section>
)
