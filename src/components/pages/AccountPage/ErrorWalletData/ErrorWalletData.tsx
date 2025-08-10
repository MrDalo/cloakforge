/* eslint-disable react/jsx-max-depth */
import { HeroSectionLayout } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Shield, UserX } from 'lucide-react'
import React from 'react'
import PrivacySection from '../PrivacySection'

interface ErrorWalletDataProps {
  onRetry: () => void
}

const ErrorWalletData = ({ onRetry }: ErrorWalletDataProps): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <HeroSectionLayout
      subtitle='There was an error loading your account data. Please check your connection and try again.'
      title='Connection Error'
      variant='destructive'
    >
      {/* Error Card */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mx-auto max-w-md'
        initial={{ opacity: 0, y: 30 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <Card className='border-destructive border-2 shadow-2xl'>
          <CardContent className='p-8 text-center'>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              className='bg-destructive mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full'
              transition={{ duration: 2, repeat: Infinity }}
            >
              <UserX className='text-destructive-foreground h-10 w-10' />
            </motion.div>

            <h3 className='mb-4 text-xl font-medium'>Error Loading Account</h3>
            <p className='text-muted-foreground mb-6'>There was an error loading your account data. Please try again.</p>

            <Button className='w-full' onClick={onRetry}>
              Try Again
            </Button>

            {/* Error Details */}
            <div className='bg-muted/50 mt-6 rounded-lg p-4'>
              <div className='text-muted-foreground mb-2 flex items-center justify-center space-x-2 text-sm'>
                <Shield className='h-4 w-4' />
                <span className='font-medium'>Connection Issues</span>
              </div>
              <p className='text-muted-foreground text-xs'>Unable to connect to Solana network. Please check your internet connection.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </HeroSectionLayout>

    <PrivacySection />
  </div>
)

export default ErrorWalletData
