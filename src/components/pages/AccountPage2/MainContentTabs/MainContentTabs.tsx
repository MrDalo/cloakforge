'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw } from 'lucide-react'
import type { WalletData } from '../types'
import SPLTokensTab from './SPLTokensTab'
import TransactionsTab from './TransactionsTab'
import AnalyticsTab from './AnalyticsTab'

interface MainContentTabsProps {
  walletData: WalletData
}

interface TabsHeaderProps {
  isLoading: boolean
  onRefresh: () => void
}

const TabsHeader: React.FC<TabsHeaderProps> = ({ isLoading, onRefresh }) => (
  <div className='flex items-center justify-between'>
    <TabsList className='grid w-full max-w-md grid-cols-3'>
      <TabsTrigger value='tokens'>SPL Tokens</TabsTrigger>
      <TabsTrigger value='transactions'>Transactions</TabsTrigger>
      <TabsTrigger value='analytics'>Analytics</TabsTrigger>
    </TabsList>
    <Button className='border-primary/20 hover:border-primary/40' disabled={isLoading} onClick={onRefresh} variant='outline'>
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  </div>
)

const MainContentTabs: React.FC<MainContentTabsProps> = ({ walletData }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = (): void => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <section className='px-6 py-0'>
      <div className='container mx-auto max-w-6xl'>
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.4, duration: 0.8 }}>
          <Tabs className='space-y-6' defaultValue='tokens'>
            <TabsHeader isLoading={isLoading} onRefresh={handleRefresh} />
            <SPLTokensTab walletData={walletData} />
            <TransactionsTab walletData={walletData} />
            <AnalyticsTab walletData={walletData} />
          </Tabs>
        </motion.div>
      </div>
    </section>
  )
}

export default MainContentTabs
