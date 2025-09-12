'use client'

import { motion } from 'framer-motion'

export const NavigationHeader = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='mb-12 text-center'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.8, duration: 0.8 }}
  >
    <h2 className='mb-4 text-2xl font-semibold text-gray-800 md:text-3xl'>Explore Our Tools</h2>
    <p className='text-muted-foreground mx-auto max-w-2xl'>
      Instead of staying lost, discover powerful tools to manage your Solana tokens with confidence.
    </p>
  </motion.div>
)
