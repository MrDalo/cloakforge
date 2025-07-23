'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

export const HeroTitle = (): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='mb-12 text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
    {/* Page Title */}
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className='bg-destructive/20 text-destructive-foreground mb-6 inline-flex items-center rounded-full px-4 py-2'
      initial={{ opacity: 0, scale: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Flame className='mr-2 h-4 w-4' />
      <span className='text-sm'>Token Burner</span>
    </motion.div>

    <motion.h1
      animate={{ opacity: 1, y: 0 }}
      className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.3, duration: 0.8 }}
    >
      <span className='from-destructive-foreground/60 to-warning bg-gradient-to-r bg-clip-text text-transparent'>Solana Token Burner</span>
    </motion.h1>

    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.4, duration: 0.8 }}
    >
      Permanently remove tokens from circulation with the lowest fees and maximum security. Reduce supply, build trust, and implement
      deflationary tokenomics safely.
    </motion.p>
  </motion.div>
)
