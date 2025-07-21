'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { dataPrivacyPoints } from './securityData'

export const MinimalDataList = (): React.ReactNode => (
  <div>
    <h4 className='mb-6 flex items-center text-xl'>
      <CheckCircle className='text-secondary mr-2 h-6 w-6' />
      What We DO Collect (Minimal)
    </h4>
    <div className='space-y-4'>
      {dataPrivacyPoints
        .filter((point) => point.status === 'minimal')
        .map((point, index) => (
          <motion.div
            className='bg-secondary/5 border-secondary/20 flex items-start space-x-3 rounded-lg border p-4'
            initial={{ opacity: 0, x: 20 }}
            key={index}
            transition={{ delay: 0.1 * index, duration: 0.4 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <CheckCircle className='text-secondary mt-0.5 h-5 w-5 flex-shrink-0' />
            <div>
              <div className='text-secondary font-medium'>{point.text}</div>
              <div className='text-muted-foreground text-sm'>{point.description}</div>
            </div>
          </motion.div>
        ))}
    </div>
  </div>
)
