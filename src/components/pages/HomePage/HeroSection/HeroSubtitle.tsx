'use client'

import { motion } from 'framer-motion'

export const HeroSubtitle = (): React.ReactNode => (
  <motion.p
    animate={{ opacity: 1, y: 0 }}
    className='text-muted-foreground mb-8 text-lg leading-relaxed md:text-xl'
    initial={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.4, duration: 0.8 }}
  >
    CloakForge is a non-custodial toolkit for the Solana blockchain — create tokens, manage liquidity, and control your digital assets with
    professional-grade tools. Fast, secure, and open, with no account or custody required.
  </motion.p>
)
