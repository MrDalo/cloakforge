'use client'

import React, { useState } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExternalLink, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, RefreshCw, Coins } from 'lucide-react'
import type { WalletData, Transaction } from '../../types'
import { formatCurrency, formatNumber } from '../../account2PageData'

interface TransactionsTabProps {
  walletData: WalletData
}

const getTransactionIcon = (type: Transaction['type']): React.ReactElement => {
  switch (type) {
    case 'send':
      return <ArrowUpRight className='h-4 w-4 text-red-500' />
    case 'receive':
      return <ArrowDownLeft className='h-4 w-4 text-green-500' />
    case 'swap':
      return <RefreshCw className='h-4 w-4 text-blue-500' />
    case 'stake':
      return <TrendingUp className='h-4 w-4 text-purple-500' />
    case 'mint':
      return <Coins className='h-4 w-4 text-yellow-500' />
    case 'burn':
      return <TrendingDown className='h-4 w-4 text-orange-500' />
    default:
      return <RefreshCw className='h-4 w-4 text-gray-500' />
  }
}

const getStatusColor = (status: Transaction['status']): string => {
  switch (status) {
    case 'success':
      return 'text-green-600'
    case 'failed':
      return 'text-red-600'
    case 'pending':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ walletData }) => {
  const [filterType, setFilterType] = useState<string>('all')

  const filteredTransactions = walletData.recentTransactions.filter((tx) => filterType === 'all' || tx.type === filterType)

  const handleViewTransaction = (signature: string): void => {
    window.open(`https://solscan.io/tx/${signature}`, '_blank')
  }

  return (
    <TabsContent className='space-y-4' value='transactions'>
      <div className='flex items-center space-x-2'>
        <Select onValueChange={setFilterType} value={filterType}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Filter by type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Transactions</SelectItem>
            <SelectItem value='send'>Send</SelectItem>
            <SelectItem value='receive'>Receive</SelectItem>
            <SelectItem value='swap'>Swap</SelectItem>
            <SelectItem value='stake'>Stake</SelectItem>
            <SelectItem value='mint'>Mint</SelectItem>
            <SelectItem value='burn'>Burn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Token</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
              <TableHead className='text-right'>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='text-center'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx.signature}>
                <TableCell>
                  <div className='flex items-center space-x-2'>
                    {getTransactionIcon(tx.type)}
                    <span className='capitalize'>{tx.type}</span>
                  </div>
                </TableCell>
                <TableCell className='font-medium'>{tx.token}</TableCell>
                <TableCell className='text-right'>{formatNumber(tx.amount)}</TableCell>
                <TableCell className='text-right'>{formatCurrency(tx.fee)}</TableCell>
                <TableCell>
                  <span className={`capitalize ${getStatusColor(tx.status)}`}>{tx.status}</span>
                </TableCell>
                <TableCell>{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                <TableCell className='text-center'>
                  <Button onClick={() => handleViewTransaction(tx.signature)} size='sm' variant='ghost'>
                    <ExternalLink className='h-4 w-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTransactions.length === 0 && <div className='text-muted-foreground py-8 text-center'>No transactions found.</div>}
    </TabsContent>
  )
}

export default TransactionsTab
