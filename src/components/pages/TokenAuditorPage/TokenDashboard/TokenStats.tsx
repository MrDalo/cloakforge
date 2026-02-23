'use client'

import { motion } from 'framer-motion'
import { DollarSign, BarChart3, TrendingUp, TrendingDown, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { type TokenData } from '../tokenAuditorData'

interface TokenStatsProps {
  tokenData: TokenData
}

export const TokenStats = ({ tokenData }: TokenStatsProps): React.ReactNode => {
  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const getSecurityColor = (score: number): string => {
    if (score >= 80) return 'text-secondary'
    if (score >= 60) return 'text-warning'
    return 'text-destructive'
  }

  const stats = [
    {
      icon: DollarSign,
      title: 'Price',
      value: `$${tokenData.price.toFixed(6)}`,
      change: tokenData.priceChange24h,
      color: tokenData.priceChange24h >= 0 ? 'text-secondary' : 'text-destructive',
    },
    {
      icon: BarChart3,
      title: 'Market Cap',
      value: formatNumber(tokenData.marketCap),
      subtitle: `Supply: ${tokenData.supply}`,
    },
    {
      icon: TrendingUp,
      title: '24h Volume',
      value: formatNumber(tokenData.volume24h),
      subtitle: `${tokenData.holders.toLocaleString()} holders`,
    },
    {
      icon: Shield,
      title: 'Security Score',
      value: `${tokenData.security.score}/100`,
      color: getSecurityColor(tokenData.security.score),
    },
  ]

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'
      initial={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.8 }}
    >
      {stats.map((stat, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          key={stat.title}
          transition={{ delay: index * 0.1, duration: 0.6 }}
        >
          <Card className='hover:border-primary/20 border-2 transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='mb-3 flex items-center space-x-3'>
                <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                  <stat.icon className='text-primary h-5 w-5' />
                </div>
                <div className='flex-1'>
                  <p className='text-muted-foreground text-sm'>{stat.title}</p>
                  <p className={`text-xl font-medium ${stat.color || ''}`}>{stat.value}</p>
                  {stat.change !== undefined && (
                    <div className={`flex items-center text-sm ${stat.color}`}>
                      {stat.change >= 0 ? <TrendingUp className='mr-1 h-3 w-3' /> : <TrendingDown className='mr-1 h-3 w-3' />}
                      {stat.change >= 0 ? '+' : ''}
                      {stat.change.toFixed(2)}%
                    </div>
                  )}
                  {stat.subtitle && <p className='text-muted-foreground text-xs'>{stat.subtitle}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
