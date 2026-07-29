/* eslint-disable react/jsx-max-depth */
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const TroubleshootingCard = (): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='mt-16' initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.9, duration: 0.8 }}>
    <Card className='border-border mx-auto max-w-4xl border-2 transition-all duration-300'>
      <CardContent className='p-8'>
        <div className='mb-6 text-center'>
          <h2 className='mb-4 text-2xl font-bold text-gray-800'>Quick Troubleshooting</h2>
        </div>
        <div className='grid gap-8 md:grid-cols-2'>
          {/* Common Solutions */}
          <div>
            <div className='mb-4 flex items-center'>
              <h3 className='text-secondary text-lg font-semibold'>Common Solutions:</h3>
            </div>
            <ul className='text-muted-foreground ml-4 list-disc space-y-2 text-sm'>
              <li>Check your wallet connection</li>
              <li>Ensure sufficient SOL for transaction fees</li>
              <li>Verify network connectivity</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>

          {/* Still Having Issues */}
          <div>
            <div className='mb-4 flex items-center'>
              <h3 className='text-primary text-lg font-semibold'>Still Having Issues?</h3>
            </div>
            <p className='text-muted-foreground mb-4 text-sm'>Our team is here to help you get back to secure token management.</p>
            <Button
              className='bg-primary hover:bg-primary-hover w-full'
              onClick={() => window.open('mailto:help@cloakforge.app', '_blank')}
              size='sm'
            >
              Contact Support
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)
