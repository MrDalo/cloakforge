'use client'

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type TokenData } from '../tokenAuditorData'

interface LiquidityInfoProps {
  tokenData: TokenData
}

export const LiquidityInfo = ({ tokenData }: LiquidityInfoProps): React.ReactNode => {
  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className='mb-12' initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.4, duration: 0.8 }}>
      <Card className='border-border border-2'>
        <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
          <CardTitle className='flex items-center space-x-2'>
            <Activity className='text-primary h-5 w-5' />
            <span>Liquidity & Trading</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div className='text-center'>
              <div className='mb-1 text-2xl font-medium'>{tokenData.liquidity.pools}</div>
              <p className='text-muted-foreground text-sm'>Active Pools</p>
            </div>
            <div className='text-center'>
              <div className='mb-1 text-2xl font-medium'>{formatNumber(tokenData.liquidity.totalLiquidity)}</div>
              <p className='text-muted-foreground text-sm'>Total Liquidity</p>
            </div>
            <div className='text-center'>
              <div className='mb-1 text-sm font-medium'>{tokenData.liquidity.largestPool}</div>
              <p className='text-muted-foreground text-sm'>Largest Pool</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
