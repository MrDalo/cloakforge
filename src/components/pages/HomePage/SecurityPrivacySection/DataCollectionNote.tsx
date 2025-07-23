'use client'

import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

export const DataCollectionNote = (): React.ReactNode => (
  <motion.div
    className='bg-info/35 border-info mt-8 rounded-lg border p-4'
    initial={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.5, duration: 0.6 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <div className='flex items-start space-x-3'>
      <AlertTriangle className='text-info-foreground mt-0.5 h-5 w-5 flex-shrink-0' />
      <div className='text-muted-foreground text-sm'>
        <strong>Note:</strong> The minimal data we collect (wallet addresses and transaction data) is already publicly available on the
        Solana blockchain. We don&apos;t add any additional tracking.
      </div>
    </div>
  </motion.div>
)
