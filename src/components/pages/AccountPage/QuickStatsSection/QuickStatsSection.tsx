'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Coins, DollarSign } from 'lucide-react'
import type { WalletData } from '../types'
import { formatCurrency } from '@/lib/utils/walletUtils'

interface QuickStatsSectionProps {
  walletData: WalletData
}

const QuickStatsSection: React.FC<QuickStatsSectionProps> = ({ walletData }) => {
  const stats = [
    {
      icon: Coins,
      title: 'SOL Balance',
      value: `${walletData.solBalance.toFixed(6)} SOL`,
      subtitle: formatCurrency(walletData.solBalance * (walletData.totalValue / walletData.solBalance || 0)), // Use real price from query
    },
    {
      icon: DollarSign,
      title: 'Portfolio Value',
      value: formatCurrency(walletData.totalValue),
      subtitle: 'Current USD value',
    },
  ]

  return (
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-6xl'>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2'
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
                      <p className='text-xl font-medium'>{stat.value}</p>
                      <p className='text-muted-foreground text-xs'>{stat.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default QuickStatsSection
