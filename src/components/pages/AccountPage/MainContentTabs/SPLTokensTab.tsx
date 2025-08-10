'use client'

import React, { useState } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { WalletData } from '../types'
import { formatCurrency, formatNumber } from '../account2PageData'

interface SPLTokensTabProps {
  walletData: WalletData
  tokenPage: number
  onTokenPageChange: (page: number) => void
}

const SPLTokensTab: React.FC<SPLTokensTabProps> = ({ walletData, tokenPage, onTokenPageChange }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTokens = walletData.splTokens.filter(
    (token) => token.name.toLowerCase().includes(searchTerm.toLowerCase()) || token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Simple client-side pagination for tokens
  const tokensPerPage = 10
  const totalPages = Math.ceil(filteredTokens.length / tokensPerPage)
  const startIndex = (tokenPage - 1) * tokensPerPage
  const paginatedTokens = filteredTokens.slice(startIndex, startIndex + tokensPerPage)

  const handleViewToken = (address: string): void => {
    window.open(`https://solscan.io/token/${address}`, '_blank')
  }

  return (
    <TabsContent className='space-y-4' value='tokens'>
      <div className='flex items-center space-x-2'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input className='pl-10' onChange={(e) => setSearchTerm(e.target.value)} placeholder='Search tokens...' value={searchTerm} />
        </div>
      </div>

      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead className='text-right'>Balance</TableHead>
              <TableHead className='text-right'>Value</TableHead>
              <TableHead className='text-right'>Price</TableHead>
              <TableHead className='text-center'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTokens.map((token) => (
              <TableRow key={token.address}>
                <TableCell className='font-medium'>
                  <div className='flex items-center space-x-3'>
                    <div className='h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600' />
                    <div>
                      <div className='font-medium'>{token.name}</div>
                      <div className='text-muted-foreground text-sm'>{token.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className='text-right'>{formatNumber(token.balance)}</TableCell>
                <TableCell className='text-right'>{formatCurrency(token.value)}</TableCell>
                <TableCell className='text-right'>{formatCurrency(token.price)}</TableCell>
                <TableCell className='text-center'>
                  <Button onClick={() => handleViewToken(token.address)} size='sm' variant='ghost'>
                    <ExternalLink className='h-4 w-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-muted-foreground text-sm'>
            Page {tokenPage} of {totalPages} ({filteredTokens.length} tokens)
          </div>
          <div className='flex items-center space-x-2'>
            <Button disabled={tokenPage <= 1} onClick={() => onTokenPageChange(tokenPage - 1)} size='sm' variant='outline'>
              <ChevronLeft className='h-4 w-4' />
              Previous
            </Button>
            <Button disabled={tokenPage >= totalPages} onClick={() => onTokenPageChange(tokenPage + 1)} size='sm' variant='outline'>
              Next
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {filteredTokens.length === 0 && <div className='text-muted-foreground py-8 text-center'>No tokens found.</div>}
    </TabsContent>
  )
}

export default SPLTokensTab
