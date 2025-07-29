'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type TokenData } from '../tokenAuditorData'
import { TokenStats } from './TokenStats'
import { TokenDetails } from './TokenDetails'
import { SecurityAnalysis } from './SecurityAnalysis'
import { LiquidityInfo } from './LiquidityInfo'
import { ActionButtons } from './ActionButtons'

interface TokenDashboardProps {
  tokenData: TokenData
  onReset: () => void
}

export const TokenDashboard = ({ tokenData, onReset }: TokenDashboardProps): React.ReactNode => {
  const copyAddress = (address: string): void => {
    navigator.clipboard.writeText(address)
  }

  const getSecurityBadgeColor = (score: number): string => {
    if (score >= 80) return 'bg-secondary/10 text-secondary border-secondary/20'
    if (score >= 60) return 'bg-warning/10 text-warning border-warning/20'
    return 'bg-destructive/10 text-destructive border-destructive/20'
  }

  return (
    <div className='bg-background relative min-h-screen'>
      {/* Hero Section for Results */}
      <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
        <div className='encrypted-pattern absolute inset-0 opacity-5' />
        <div className='relative z-10 container mx-auto max-w-6xl'>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='mb-12 text-center'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
              initial={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CheckCircle className='mr-2 h-4 w-4' />
              <span className='text-sm'>Audit Complete</span>
            </motion.div>

            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className='crypto-text-gradient'>{tokenData.name}</span>
            </motion.h1>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className='mb-8 flex items-center justify-center space-x-4'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <Badge className='px-4 py-2 text-lg' variant='outline'>
                {tokenData.symbol}
              </Badge>
              <Badge className={`px-4 py-2 text-lg ${getSecurityBadgeColor(tokenData.security.score)}`}>
                Security: {tokenData.security.score}/100
              </Badge>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className='text-muted-foreground flex items-center justify-center space-x-2'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <span className='font-mono text-sm'>{tokenData.address}</span>
              <Button className='h-6 w-6 p-0' onClick={() => copyAddress(tokenData.address)} size='sm' variant='ghost'>
                <Copy className='h-3 w-3' />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Token Dashboard */}
      <section className='px-6 py-16'>
        <div className='container mx-auto max-w-6xl'>
          <TokenStats tokenData={tokenData} />

          <div className='mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2'>
            <TokenDetails tokenData={tokenData} />
            <SecurityAnalysis tokenData={tokenData} />
          </div>

          <LiquidityInfo tokenData={tokenData} />
          <ActionButtons onReset={onReset} />
        </div>
      </section>
    </div>
  )
}
