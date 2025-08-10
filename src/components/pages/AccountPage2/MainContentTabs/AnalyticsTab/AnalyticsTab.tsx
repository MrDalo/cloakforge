'use client'

import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Activity, PieChart, BarChart3 } from 'lucide-react'
import type { WalletData } from '../../types'
import { formatCurrency } from '../../account2PageData'

interface AnalyticsTabProps {
  walletData: WalletData
}

interface DistributionItemProps {
  label: string
  percentage: string
}

const DistributionItem: React.FC<DistributionItemProps> = ({ label, percentage }) => (
  <div className='flex justify-between'>
    <span className='text-sm'>{label}</span>
    <span className='text-sm font-medium'>{percentage}%</span>
  </div>
)

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ walletData }) => {
  const profitLoss = walletData.valueChange24h
  const profitLossPercentage = ((profitLoss / (walletData.totalValue - profitLoss)) * 100).toFixed(2)
  const solPercentage = (((walletData.solBalance * 150) / walletData.totalValue) * 100).toFixed(1)
  const splPercentage = (((walletData.totalValue - walletData.solBalance * 150) / walletData.totalValue) * 100).toFixed(1)
  const activityScore = Math.min(Math.floor(walletData.transactionCount / 10), 100)

  return (
    <TabsContent className='space-y-6' value='analytics'>
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>24h P&L</CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitLoss >= 0 ? '+' : ''}
              {formatCurrency(profitLoss)}
            </div>
            <p className='text-muted-foreground text-xs'>
              {profitLoss >= 0 ? '+' : ''}
              {profitLossPercentage}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Activity Score</CardTitle>
            <Activity className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activityScore}</div>
            <p className='text-muted-foreground text-xs'>Based on {walletData.transactionCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Portfolio Distribution</CardTitle>
            <PieChart className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <DistributionItem label='SOL' percentage={solPercentage} />
              <DistributionItem label='SPL Tokens' percentage={splPercentage} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Token Diversity</CardTitle>
            <BarChart3 className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{walletData.splTokens.length}</div>
            <p className='text-muted-foreground text-xs'>Different SPL tokens held</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>{formatCurrency(walletData.stakingRewards)}</div>
              <p className='text-muted-foreground text-sm'>Staking Rewards</p>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>{walletData.nftCount}</div>
              <p className='text-muted-foreground text-sm'>NFTs Owned</p>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>{walletData.transactionCount}</div>
              <p className='text-muted-foreground text-sm'>Total Transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}

export default AnalyticsTab
