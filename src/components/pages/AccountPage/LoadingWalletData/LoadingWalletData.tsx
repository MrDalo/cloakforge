/* eslint-disable react/jsx-max-depth */
import { HeroSectionLayout } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, Shield } from 'lucide-react'
import React from 'react'
import PrivacySection from '../PrivacySection'

type Props = {
  isBalanceQueryLoading: boolean
  isTokensQueryLoading: boolean
  isTransactionsQueryLoading: boolean
}

const LoadingWalletData = ({ isBalanceQueryLoading, isTokensQueryLoading, isTransactionsQueryLoading }: Props): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <HeroSectionLayout subtitle='Loading your portfolio data from the Solana blockchain...' title='My Wallet'>
      {/* Loading Card */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mx-auto max-w-md'
        initial={{ opacity: 0, y: 30 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <Card className='border-primary/20 border-2 shadow-2xl'>
          <CardContent className='p-8 text-center'>
            <motion.div
              animate={{ rotate: 360 }}
              className='bg-primary/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full'
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className='text-primary h-10 w-10 animate-spin' />
            </motion.div>

            <h3 className='mb-4 text-xl font-medium'>Loading Your Wallet</h3>
            <p className='text-muted-foreground mb-6'>Fetching your account information and assets from the Solana blockchain.</p>

            <Button className='w-full' disabled>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading...
            </Button>

            {/* Loading Progress */}
            <div className='bg-muted/50 mt-6 rounded-lg p-4'>
              <div className='text-muted-foreground mb-2 flex items-center justify-center space-x-2 text-sm'>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <Shield className='h-4 w-4' />
                </motion.div>
                <span className='font-medium'>Securing Connection</span>
              </div>
              <p className='text-muted-foreground text-xs'>Establishing secure connection to blockchain...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </HeroSectionLayout>

    {/* Loading Status */}
    <section className='bg-muted/30 px-6 py-16'>
      <div className='container mx-auto max-w-4xl text-center'>
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.6, duration: 0.8 }}>
          <h2 className='mb-6 text-2xl font-medium'>Loading Portfolio Data</h2>
          <div className='flex justify-center space-x-8'>
            {[
              { label: 'Balance', status: isBalanceQueryLoading },
              { label: 'Tokens', status: isTokensQueryLoading },
              { label: 'Transactions', status: isTransactionsQueryLoading },
            ].map((item, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className='flex items-center space-x-2'
                initial={{ opacity: 0, y: 20 }}
                key={item.label}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
              >
                {item.status ?
                  <Loader2 className='text-primary h-4 w-4 animate-spin' />
                : <CheckCircle className='text-secondary h-4 w-4' />}
                <span className='text-muted-foreground text-sm'>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>

    <PrivacySection />
  </div>
)

export default LoadingWalletData
