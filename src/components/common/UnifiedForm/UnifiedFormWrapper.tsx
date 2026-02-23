'use client'

import { motion } from 'framer-motion'
import { type UnifiedFormWrapperProps } from './types'
import { cn } from '@/lib/utils'

export const UnifiedFormWrapper = ({ children, className, id }: UnifiedFormWrapperProps): React.ReactNode => (
  <section className={cn('px-6 py-16', className)} id={id}>
    <div className='container mx-auto max-w-4xl'>
      <motion.div
        className='mb-12'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        {children}
      </motion.div>
    </div>
  </section>
)
