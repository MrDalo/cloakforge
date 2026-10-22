/* eslint-disable react/jsx-max-depth */
'use client'
import React from 'react'
import PrivacySection from '../PrivacySection'
import { motion } from 'framer-motion'
import { HeroSectionLayout, WalletConnectionButton } from '@/components/common'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, UserX, Wallet } from 'lucide-react'

const NotConnectedWallet = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <HeroSectionLayout
      subtitle='Connect your Solana wallet to view your complete portfolio, track assets, and analyze transaction history'
      title='My Wallet'
    >
      {/* Connection Card */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mx-auto max-w-md'
        initial={{ opacity: 0, y: 30 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <Card className='border-primary/20 border-2 shadow-2xl'>
          <CardContent className='p-8 text-center'>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              className='bg-primary/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full'
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wallet className='text-primary h-10 w-10' />
            </motion.div>

            <h3 className='mb-4 text-xl font-medium'>Connect Your Wallet</h3>
            <p className='text-muted-foreground mb-6'>Securely connect your Solana wallet to access your portfolio and transaction data</p>

            <WalletConnectionButton />

            {/* Privacy Message */}
            <div className='bg-muted/50 mt-6 rounded-lg p-4'>
              <div className='text-muted-foreground mb-2 flex items-center justify-center space-x-2 text-sm'>
                <Shield className='h-4 w-4' />
                <span className='font-medium'>Privacy-Respecting</span>
              </div>
              <p className='text-muted-foreground text-xs'>
                Minimal data: no accounts, no analytics, no ad trackers. Wallet activity is public on-chain.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </HeroSectionLayout>

    {/* Features Preview */}
    <section className='bg-muted/30 px-6 py-16'>
      <div className='container mx-auto max-w-6xl'>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='mb-12 text-center'
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <h2 className='mb-4 text-2xl md:text-3xl'>What You&apos;ll See After Connecting</h2>
          <p className='text-muted-foreground mx-auto max-w-2xl'>
            Your complete Solana portfolio overview with real-time data and comprehensive analytics
          </p>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {[
            {
              icon: Wallet,
              title: 'Portfolio Balance',
              description: 'View your total SOL balance and USD value with 24h change tracking',
            },
            {
              icon: Shield,
              title: 'SPL Token Holdings',
              description: 'Complete list of all your SPL tokens with current values and performance',
            },
            {
              icon: UserX,
              title: 'Transaction History',
              description: 'Detailed transaction history with filtering and export capabilities',
            },
          ].map((feature, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className='group'
              initial={{ opacity: 0, y: 20 }}
              key={feature.title}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className='hover:border-primary/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                <CardContent className='p-6'>
                  <motion.div
                    className='bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300'
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <feature.icon className='text-primary h-6 w-6' />
                  </motion.div>
                  <h3 className='group-hover:text-primary mb-2 font-medium transition-colors duration-300'>{feature.title}</h3>
                  <p className='text-muted-foreground text-sm'>{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Privacy Banner */}
    <PrivacySection />
  </div>
)

export default NotConnectedWallet
