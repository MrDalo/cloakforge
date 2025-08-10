'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Wallet, CreditCard, Copy, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react'
import type { WalletData } from '../types'
import { formatCurrency, copyAddress } from '../account2PageData'

interface HeroSectionProps {
  isConnected: boolean
  walletData: WalletData
  onConnect: () => void
}

const HeroSection: React.FC<HeroSectionProps> = ({ isConnected, walletData, onConnect }) => {
  if (!isConnected) {
    return (
      <div className='bg-background relative flex min-h-screen items-center justify-center'>
        <Card className='mx-6 w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <Wallet className='text-muted-foreground mx-auto mb-6 h-16 w-16' />
            <h3 className='mb-4 text-xl font-medium'>Connect Your Wallet</h3>
            <p className='text-muted-foreground mb-6'>
              Connect your Solana wallet to view your account information and manage your assets.
            </p>
            <Button className='bg-primary hover:bg-primary-hover text-primary-foreground w-full' onClick={onConnect}>
              <Wallet className='mr-2 h-4 w-4' />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 pt-16 pb-0'>
      {/* Background Elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360],
          }}
          className='border-primary/20 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-full border-2'
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Wallet className='text-primary/40 h-6 w-6' />
        </motion.div>

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          className='bg-primary/10 absolute right-1/4 bottom-20 h-32 w-32 rounded-full blur-xl'
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className='relative z-10 container mx-auto max-w-6xl'>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='mb-12 text-center'
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          {/* Page Title */}
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
            initial={{ opacity: 0, scale: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CreditCard className='mr-2 h-4 w-4' />
            <span className='text-sm'>Account Overview</span>
          </motion.div>

          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className='crypto-text-gradient'>My Wallet</span>
          </motion.h1>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='text-muted-foreground mb-8 flex items-center justify-center space-x-2'
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className='font-mono text-sm'>{walletData.address}</span>
            <Button className='h-6 w-6 p-0' onClick={() => copyAddress(walletData.address)} size='sm' variant='ghost'>
              <Copy className='h-3 w-3' />
            </Button>
            <Button className='h-6 w-6 p-0' size='sm' variant='ghost'>
              <ExternalLink className='h-3 w-3' />
            </Button>
          </motion.div>

          {/* Portfolio Value */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='mb-8 text-center'
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className='mb-2 text-4xl font-medium md:text-5xl'>{formatCurrency(walletData.totalValue)}</div>
            <div
              className={`flex items-center justify-center space-x-1 ${
                walletData.valueChange24h >= 0 ? 'text-secondary' : 'text-destructive'
              }`}
            >
              {walletData.valueChange24h >= 0 ? <TrendingUp className='h-4 w-4' /> : <TrendingDown className='h-4 w-4' />}
              <span>
                {walletData.valueChange24h >= 0 ? '+' : ''}
                {walletData.valueChange24h.toFixed(2)}% (24h)
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default HeroSection
