'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const trustReasons = [
  'Demonstrate commitment to decentralization',
  'Protect holders from arbitrary freezing',
  'Increase token value and investor confidence',
  'Meet listing requirements for major exchanges',
]

export const TrustReasons = () => (
  <motion.div
    animate={{ opacity: 1 }}
    className='mb-12 flex flex-wrap justify-center gap-4'
    initial={{ opacity: 0 }}
    transition={{ delay: 0.4, duration: 0.8 }}
  >
    {trustReasons.map((reason, index) => (
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className='bg-secondary/5 border-secondary/20 flex items-center gap-2 rounded-full border px-4 py-1.5'
        initial={{ opacity: 0, scale: 0.9 }}
        key={index}
        transition={{ delay: 0.5 + index * 0.1 }}
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--secondary), 0.1)' }}
      >
        <CheckCircle2 className='text-secondary h-4 w-4' />
        <span className='text-sm font-medium'>{reason}</span>
      </motion.div>
    ))}
  </motion.div>
)
