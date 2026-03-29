'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export const CTAHeader = (): React.ReactNode => (
  <>
    <motion.div
      className='relative mx-auto mb-8 flex size-20 items-center justify-center overflow-hidden rounded-2xl'
      initial={{ opacity: 0, scale: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, scale: 1 }}
    >
      <Image alt='CloakForge' className='h-full w-full object-cover' fill sizes='80px' src='/cloakforge-logo.webp' />
    </motion.div>

    <motion.h2
      className='mb-6 text-3xl md:text-5xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      Ready to Build Something Amazing?
    </motion.h2>

    <motion.p
      className='text-muted-foreground mx-auto mb-8 max-w-3xl text-xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      Join thousands of developers and creators who trust CloakForge for their Solana token needs. Professional tools, instant access, fair
      pricing.
    </motion.p>
  </>
)
