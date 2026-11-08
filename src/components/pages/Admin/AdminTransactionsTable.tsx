'use client'
import React, { useState, useEffect } from 'react'
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
import { AppError, handleError, isUserRejectionError } from '@/lib/errors'
import { ADMIN_ACCESS_MESSAGE_TTL_MS, buildAdminAccessMessage, encodeAdminAccessMessageHeader } from '@/lib/security/adminAuthMessage'

// Types (remove duplicates since they're imported from the hook)
interface AdminTransactionsTableProps {
  className?: string
}

/** A signed admin access message, valid for ADMIN_ACCESS_MESSAGE_TTL_MS from issuedAtMs */
interface AdminAuth {
  walletAddress: string
  /** Base64 ed25519 signature of the message */
  signature: string
  /** Base64 of the message text (sent in the x-message header, which cannot carry newlines) */
  encodedMessage: string
  issuedAtMs: number
}

// Drop the session slightly before the server-side TTL so requests never carry an expired message
const AUTH_EXPIRY_MARGIN_MS = 30 * 1000

const logger = getLogger({
  context: 'component',
  component: 'AdminTransactionsTable',
})

const AdminTransactionsTable = ({ className }: AdminTransactionsTableProps): React.ReactNode => {
  const { publicKey, signMessage } = useWallet()
  const walletAddress = publicKey?.toBase58() ?? null

  // State management
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSignatures, setPageSignatures] = useState<string[]>(['']) // First page has no 'before' signature
  const [adminAuth, setAdminAuth] = useState<AdminAuth | null>(null)
  const [isSigning, setIsSigning] = useState(false)

  // A signature only authenticates the wallet that produced it (switching wallets drops the session)
  const activeAuth = adminAuth && adminAuth.walletAddress === walletAddress ? adminAuth : null

  // Expire the session shortly before the server would reject it, so the admin is asked to sign again
  useEffect(() => {
    if (!adminAuth) return

    const msUntilExpiry = adminAuth.issuedAtMs + ADMIN_ACCESS_MESSAGE_TTL_MS - AUTH_EXPIRY_MARGIN_MS - Date.now()
    const timer = setTimeout(() => setAdminAuth(null), Math.max(msUntilExpiry, 0))
    return () => clearTimeout(timer)
  }, [adminAuth])

  // Sign a fresh, domain-bound, short-lived admin access message (user-initiated)
  const signAdminAccess = async (): Promise<void> => {
    if (!walletAddress || !signMessage || isSigning) return

    setIsSigning(true)
    try {
      const issuedAt = new Date()
      const message = buildAdminAccessMessage({ domain: window.location.host, wallet: walletAddress, issuedAt })
      const signatureBytes = await signMessage(new TextEncoder().encode(message))

      setAdminAuth({
        walletAddress,
        signature: Buffer.from(signatureBytes).toString('base64'),
        encodedMessage: encodeAdminAccessMessageHeader(message),
        issuedAtMs: issuedAt.getTime(),
      })
    } catch (error) {
      const logFn = isUserRejectionError(error) ? logger.warn : logger.error
      logFn('Failed to obtain admin signature', error)
      toast.error('Please approve the signature request to access admin data')
    } finally {
      setIsSigning(false)
    }
  }

  const limit = 40 // Items per page

  // Use the custom hook for fetching transactions
  const { data, isLoading, error, refetch, isFetching } = useAdminTransactionsQuery({
    limit,
    before: pageSignatures[currentPage] || undefined,
    serviceFilter: serviceFilter !== 'all' ? serviceFilter : undefined,
    authSignature: activeAuth?.signature ?? null,
    authMessage: activeAuth?.encodedMessage ?? null,
    enabled: !!activeAuth,
  })

  // Server rejected the session (expired, wrong domain, bad signature) — offer to sign again
  const isSessionRejected = error instanceof AppError && error.code === 'UNAUTHORIZED'

  // Handle query errors with toast notifications
  useEffect(() => {
    if (error) {
      logger.error('Query error occurred', error)

      // Use the centralized error handling system
      const userMessage = handleError(error)
      toast.error(userMessage)
    }
  }, [error])

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

    // No valid session (never signed or expired) — signing triggers a fresh fetch
    if (!activeAuth) {
      void signAdminAccess()
      return
    }

    refetch()
    toast.success('Refreshing transactions...')
  }

  const emptyStateMessage =
    serviceFilter !== 'all' ? (
      <>
        No transactions found
        <div className='mt-1'>Try changing the service filter</div>
      </>
    ) : (
      'No transactions found'
    )

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

          {/* Sign-in State (no session yet, or the previous one expired) */}
          {!activeAuth && (
            <div className='py-8 text-center'>
              <div className='text-muted-foreground mb-4 text-sm'>
                Sign a message with your wallet to load admin data. Admin sessions expire after 10 minutes.
              </div>
              <Button disabled={isSigning || !signMessage} onClick={() => void signAdminAccess()} variant='outline'>
                {isSigning ? 'Waiting for signature...' : 'Sign admin access message'}
              </Button>
            </div>
          )}

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
              {isSessionRejected ? (
                <Button disabled={isSigning} onClick={() => void signAdminAccess()} variant='outline'>
                  Sign Again
                </Button>
              ) : (
                <Button onClick={() => refetch()} variant='outline'>
                  Try Again
                </Button>
              )}
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
                    {data.transactions.length === 0 ? (
                      <TableRow>
                        <TableCell className='text-muted-foreground py-8 text-center' colSpan={5}>
                          {emptyStateMessage}
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.transactions.map((transaction: TransactionData) => (
                        <TransactionRow key={transaction.signature} transaction={transaction} />
                      ))
                    )}
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
