'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Wallet, Copy, ExternalLink } from 'lucide-react'
import { AnimatedBackground, HeroHeading } from '@/components/common'
import type { WalletData } from '../types'
import { formatCurrency, copyAddress } from '@/lib/utils/walletUtils'

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
      <AnimatedBackground />

      <div className='relative z-10 container mx-auto max-w-6xl'>
        <div className='mb-12 text-center'>
          <HeroHeading title='My Wallet' />

          {/* Wallet Address */}
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
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
