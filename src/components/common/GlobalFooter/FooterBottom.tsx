'use client'

import { motion } from 'framer-motion'
import { Shield, Globe } from 'lucide-react'

export const FooterBottom = (): React.ReactNode => (
  <motion.div
    className='border-border border-t pt-8'
    initial={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.4, duration: 0.6 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <div className='flex flex-col items-center justify-between md:flex-row'>
      <div className='mb-4 flex flex-col items-center gap-4 md:mb-0 md:flex-row'>
        <p className='text-muted-foreground text-sm'>© 2025 SolCloak. Built for creators.</p>
        <div className='text-muted-foreground flex items-center gap-4 text-sm'>
          <div className='flex items-center'>
            <Shield className='text-primary mr-1 h-4 w-4' />
            Secure & Reliable
          </div>
          <div className='flex items-center'>
            <Globe className='text-secondary mr-1 h-4 w-4' />
            Global Access
          </div>
        </div>
      </div>

      <div className='flex items-center gap-4 text-sm'>
        <span className='text-primary'>Built with ❤️ for the Solana community</span>
      </div>
    </div>
  </motion.div>
)
