'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const PrivacySection: React.FC = () => (
  <motion.section
    animate={{ opacity: 1, y: 0 }}
    className='px-6 py-12'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.6, duration: 0.8 }}
  >
    <div className='container mx-auto max-w-6xl'>
      <div className='from-primary/5 to-secondary/5 rounded-lg border bg-gradient-to-r p-6 text-center'>
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.9, duration: 0.8 }}>
          <div className='mb-4 flex items-center justify-center space-x-2'>
            <UserX className='text-primary h-6 w-6' />
            <h3 className='text-xl font-medium'>Privacy-Respecting</h3>
          </div>
          <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>
            Minimal data: no accounts, no analytics, no ad trackers. No account is needed, and wallet activity is public on-chain. We
            don&apos;t log IP addresses in our app; our host processes them briefly for delivery and security.
          </p>
          <div className='flex flex-wrap justify-center gap-4 text-sm'>
            {['No Account Needed', 'No User Tracking', 'No Analytics', 'No Tracking Cookies'].map((item) => (
              <Badge className='border-primary/30 text-primary' key={item} variant='outline'>
                <CheckCircle className='mr-1 h-3 w-3' />
                {item}
              </Badge>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </motion.section>
)

export default PrivacySection
