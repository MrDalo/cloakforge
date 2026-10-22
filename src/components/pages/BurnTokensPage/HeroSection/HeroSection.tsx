'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { FeatureHighlights } from './FeatureHighlights'
import { BurnReasons } from './BurnReasons'

export const HeroSection = (): React.ReactNode => (
  <section className='from-destructive/40 to-destructive/40 after:to-background dark:from-destructive/10 dark:via-background dark:to-destructive/10 relative overflow-hidden bg-gradient-to-br via-white px-6 py-16 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-24 after:bg-gradient-to-b after:from-transparent md:py-20'>
    {/* Background Elements */}
    <div className='absolute inset-0 overflow-hidden'>
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -30, 0],
          rotate: [0, 15, 0],
        }}
        className='border-destructive-foreground/40 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-lg border-2'
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      >
        <Flame className='text-destructive-foreground/40 h-6 w-6' />
      </motion.div>

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        className='bg-destructive/8- absolute right-1/4 bottom-20 h-32 w-32 rounded-full blur-xl'
        transition={{ duration: 6, repeat: Infinity }}
      />
    </div>

    <div className='relative z-10 container mx-auto max-w-6xl'>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mb-12 text-center'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
      >
        {/* Page Title */}
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className='bg-destructive text-destructive-foreground mb-6 inline-flex items-center rounded-full px-4 py-2'
          initial={{ opacity: 0, scale: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Flame className='mr-2 h-4 w-4' />
          <span className='text-sm'>Token Burner</span>
        </motion.div>

        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className='mb-6 text-3xl leading-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Burn <span className='text-destructive-foreground/90'>Tokens</span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Permanently remove tokens from circulation with low, transparent fees and built-in confirmation steps. Reduce supply, build trust,
          and implement deflationary tokenomics safely.
        </motion.p>
      </motion.div>

      <FeatureHighlights />
      <BurnReasons />
    </div>
  </section>
)
