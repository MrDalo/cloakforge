'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

const PrivacySection: React.FC = () => (
  <motion.section
    animate={{ opacity: 1, y: 0 }}
    className='px-6 py-12'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.6, duration: 0.8 }}
  >
    <div className='container mx-auto max-w-6xl'>
      <div className='from-primary/10 to-secondary/10 rounded-lg border bg-gradient-to-r p-6 text-center'>
        <Shield className='text-primary mx-auto mb-4 h-12 w-12' />
        <h3 className='mb-2 text-lg font-semibold'>Privacy & Security</h3>
        <p className='text-muted-foreground text-sm'>
          Your wallet data is fetched directly from the blockchain and never stored on our servers. All account information displayed here
          is publicly available on the Solana network.
        </p>
      </div>
    </div>
  </motion.section>
)

export default PrivacySection
