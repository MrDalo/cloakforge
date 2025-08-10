'use client'

import React, { useState } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  TrendingUp,
  Coins,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { WalletData, Transaction } from '../types'
import type { TransactionData } from '@/types/transaction'
import { formatCurrency, formatNumber } from '../account2PageData'

interface TransactionsTabProps {
  walletData: WalletData
  transactionPage: number
  onTransactionPageChange: (page: number) => void
  transactionsData?: {
    transactions: TransactionData[]
    totalPages: number
  }
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

const getStatusDisplay = (status: Transaction['status']): React.ReactElement => {
  switch (status) {
    case 'finalized':
      return (
        <span className='flex items-center gap-1 text-green-600'>
          <CheckCircle className='h-3 w-3' />
          Finalized
        </span>
      )
    case 'confirmed':
      return (
        <span className='flex items-center gap-1 text-blue-600'>
          <CheckCircle className='h-3 w-3' />
          Confirmed
        </span>
      )
    case 'processed':
      return (
        <span className='flex items-center gap-1 text-yellow-600'>
          <Clock className='h-3 w-3' />
          Processed
        </span>
      )
    default:
      return (
        <span className='flex items-center gap-1 text-gray-600'>
          <Clock className='h-3 w-3' />
          Unknown
        </span>
      )
  }
}

const getSuccessDisplay = (isSuccess: boolean | null): React.ReactElement => {
  if (isSuccess === null) {
    return <span className='text-gray-400'>-</span>
  }
  return isSuccess ? <CheckCircle className='h-4 w-4 text-green-500' /> : <XCircle className='h-4 w-4 text-red-500' />
}

const formatTimestamp = (time: number | null): string => {
  if (!time) return '-'
  return new Date(time * 1000).toLocaleString()
}

const formatAddress = (address: string | null): string => {
  if (!address) return '-'
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ walletData, transactionPage, onTransactionPageChange, transactionsData }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<string>('all')

  // Use real transaction data if available, otherwise fallback to walletData
  const transactions = transactionsData?.transactions || walletData.recentTransactions
  const totalPages = transactionsData?.totalPages || 1

  // Filter transactions by type
  const filteredTransactions = transactions.filter((tx) => filterType === 'all' || tx.type === filterType)

  // Sort transactions by time (most recent first by default)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const timeA = a.time || 0
    const timeB = b.time || 0
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
  })

  const handleViewTransaction = (signature: string): void => {
    window.open(`https://solscan.io/tx/${signature}`, '_blank')
  }

  const handleViewBlock = (blockNumber: number): void => {
    window.open(`https://solscan.io/block/${blockNumber}`, '_blank')
  }

  const toggleSortOrder = (): void => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
  }

  return (
    <TabsContent className='space-y-4' value='transactions'>
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground text-sm'>{sortedTransactions.length} transactions found</div>
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
              <SelectItem value='unknown'>Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Signature</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Block</TableHead>
              <TableHead className='cursor-pointer' onClick={toggleSortOrder}>
                Time {sortOrder === 'desc' ? '🔽' : '🔼'}
              </TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className='text-right'>Amount (SOL)</TableHead>
              <TableHead className='text-right'>Fee (SOL)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-center'>Success</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((tx) => (
              <TableRow key={tx.signature}>
                <TableCell>
                  <div className='flex items-center space-x-2'>
                    <span className='font-mono text-xs'>{formatAddress(tx.signature)}</span>
                    <Button onClick={() => handleViewTransaction(tx.signature)} size='sm' variant='ghost'>
                      <ExternalLink className='h-3 w-3' />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center space-x-2'>
                    {getTransactionIcon(tx.type)}
                    <span className='capitalize'>{tx.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center space-x-2'>
                    <span className='font-mono'>{tx.block.toLocaleString()}</span>
                    <Button onClick={() => handleViewBlock(tx.block)} size='sm' variant='ghost'>
                      <ExternalLink className='h-3 w-3' />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className='text-xs'>{formatTimestamp(tx.time)}</TableCell>
                <TableCell className='font-mono text-xs'>{formatAddress(tx.source)}</TableCell>
                <TableCell className='font-mono text-xs'>{formatAddress(tx.destination)}</TableCell>
                <TableCell className='text-right font-mono'>{formatNumber(tx.amount)}</TableCell>
                <TableCell className='text-right font-mono'>{formatCurrency(tx.fee)}</TableCell>
                <TableCell>{getStatusDisplay(tx.status)}</TableCell>
                <TableCell className='text-center'>{getSuccessDisplay(tx.isSuccess)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-muted-foreground text-sm'>
            Page {transactionPage} of {totalPages}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              disabled={transactionPage <= 1}
              onClick={() => onTransactionPageChange(transactionPage - 1)}
              size='sm'
              variant='outline'
            >
              <ChevronLeft className='h-4 w-4' />
              Previous
            </Button>
            <Button
              disabled={transactionPage >= totalPages}
              onClick={() => onTransactionPageChange(transactionPage + 1)}
              size='sm'
              variant='outline'
            >
              Next
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {sortedTransactions.length === 0 && <div className='text-muted-foreground py-8 text-center'>No transactions found.</div>}
    </TabsContent>
  )
}

export default TransactionsTab
