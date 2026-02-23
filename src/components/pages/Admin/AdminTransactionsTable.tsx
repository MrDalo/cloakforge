'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Buffer } from 'buffer'
import { getLogger } from '@/lib/logger/logger'
import { toast } from 'sonner'
import TransactionRow from './TransactionRow'
import ServiceFilter from './ServiceFilter'
import { useAdminTransactionsQuery, type TransactionData } from '@/hooks/queries/useAdminTransactionsQuery'
import { handleError } from '@/lib/errors'

// Types (remove duplicates since they're imported from the hook)
interface AdminTransactionsTableProps {
  className?: string
}

const AdminTransactionsTable = ({ className }: AdminTransactionsTableProps): React.ReactNode => {
  const { publicKey, signMessage } = useWallet()

  // State management
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSignatures, setPageSignatures] = useState<string[]>(['']) // First page has no 'before' signature
  const [authSignature, setAuthSignature] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  // Track current wallet to detect changes
  const currentWallet = useRef<string | null>(null)

  // Logger with component context (memoized to prevent unnecessary re-renders)
  const logger = useMemo(
    () =>
      getLogger({
        context: 'component',
        component: 'AdminTransactionsTable',
      }),
    []
  )

  // Handle wallet connection and signature management
  useEffect(() => {
    const walletAddress = publicKey?.toBase58() || null

    // If wallet changed, clear existing signature
    if (currentWallet.current !== walletAddress) {
      setAuthSignature(null)
      setAuthMessage(null)
      currentWallet.current = walletAddress
    }

    // Get signature if wallet is connected and we don't have one
    const getSignature = async (): Promise<void> => {
      if (!publicKey || !signMessage || authSignature) return

      try {
        const now = Date.now()
        const message = `CloakForge Admin Session: ${now}`

        const messageBytes = new TextEncoder().encode(message)
        const signatureBytes = await signMessage(messageBytes)
        const signatureBase64 = Buffer.from(signatureBytes).toString('base64')

        setAuthSignature(signatureBase64)
        setAuthMessage(message)
      } catch (error) {
        logger.error('Failed to obtain admin signature', error)
        toast.error('Please approve the signature request to access admin data')
      }
    }

    if (publicKey && !authSignature) {
      getSignature()
    }
  }, [publicKey, signMessage, authSignature, logger])

  const limit = 40 // Items per page

  // Use the custom hook for fetching transactions
  const { data, isLoading, error, refetch, isFetching } = useAdminTransactionsQuery({
    limit,
    before: pageSignatures[currentPage] || undefined,
    serviceFilter: serviceFilter !== 'all' ? serviceFilter : undefined,
    authSignature,
    authMessage,
    enabled: !!publicKey && !!signMessage && !!authSignature && !!authMessage,
  })

  // Handle query errors with toast notifications
  useEffect(() => {
    if (error) {
      logger.error('Query error occurred', error)

      // Use the centralized error handling system
      const userMessage = handleError(error)
      toast.error(userMessage)
    }
  }, [error, logger])

  // Handle filter change
  const handleFilterChange = (value: string): void => {
    setServiceFilter(value)
    setCurrentPage(0)
    setPageSignatures(['']) // Reset to first page
  }

  // Handle next page
  const handleNextPage = (): void => {
    if (data?.hasMore && data.lastSignature) {
      const newPageSignatures = [...pageSignatures]
      if (newPageSignatures.length === currentPage + 1) {
        newPageSignatures.push(data.lastSignature)
        setPageSignatures(newPageSignatures)
      }
      setCurrentPage(currentPage + 1)
    }
  }

  // Handle previous page
  const handlePreviousPage = (): void => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Handle refresh
  const handleRefresh = (): void => {
    setCurrentPage(0)
    setPageSignatures([''])
    setAuthSignature(null) // Clear signature to get fresh one
    setAuthMessage(null)
    refetch()
    toast.success('Refreshing transactions...')
  }

  const emptyStateMessage =
    serviceFilter !== 'all' ?
      <>
        No transactions found
        <div className='mt-1'>Try changing the service filter</div>
      </>
    : 'No transactions found'

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-xl'>Service Fee Transactions</CardTitle>
              <CardDescription>View all service fee payments received from CloakForge platform services</CardDescription>
            </div>
            <Button disabled={isFetching} onClick={handleRefresh} size='sm' variant='outline'>
              <RotateCcw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className='mb-6 flex items-center gap-4'>
            <ServiceFilter onChange={handleFilterChange} value={serviceFilter} />

            {data?.total !== undefined && (
              <div className='text-muted-foreground text-sm'>
                {data.total} transaction{data.total !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className='space-y-4'>
              <div className='flex items-center justify-center py-8'>
                <LoadingSpinner />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className='py-8 text-center'>
              <div className='mb-2 text-red-600'>Error loading transactions</div>
              <div className='text-muted-foreground mb-4 text-sm'>{error instanceof Error ? error.message : 'Unknown error occurred'}</div>
              <Button onClick={() => refetch()} variant='outline'>
                Try Again
              </Button>
            </div>
          )}

          {/* Table */}
          {data && !isLoading && !error && (
            <>
              <div className='overflow-hidden rounded-lg border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-32'>Transaction</TableHead>
                      <TableHead className='w-32'>Payer</TableHead>
                      <TableHead className='w-24 text-right'>Fee (SOL)</TableHead>
                      <TableHead className='w-32'>Service</TableHead>
                      <TableHead className='w-40'>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.transactions.length === 0 ?
                      <TableRow>
                        <TableCell className='text-muted-foreground py-8 text-center' colSpan={5}>
                          {emptyStateMessage}
                        </TableCell>
                      </TableRow>
                    : data.transactions.map((transaction: TransactionData) => (
                        <TransactionRow key={transaction.signature} transaction={transaction} />
                      ))
                    }
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.transactions.length > 0 && (
                <div className='mt-4 flex items-center justify-between'>
                  <div className='text-muted-foreground text-sm'>
                    Page {currentPage + 1}
                    {data.hasMore && ' of many'}
                  </div>

                  <div className='flex gap-2'>
                    <Button disabled={currentPage === 0 || isFetching} onClick={handlePreviousPage} size='sm' variant='outline'>
                      <ChevronLeft className='mr-1 h-4 w-4' />
                      Previous
                    </Button>

                    <Button disabled={!data.hasMore || isFetching} onClick={handleNextPage} size='sm' variant='outline'>
                      Next
                      <ChevronRight className='ml-1 h-4 w-4' />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminTransactionsTable
