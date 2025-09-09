/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback } from 'react'
import { getLogger } from '@/lib/logger/logger'
import { handleApiResponse } from '@/lib/utils/handleApiResponse'
import { HTTPError, SolanaError, AppError, type ApiResponseBase } from '@/types'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import type { ServiceIdentifier } from '@/lib/solana/serviceMemo'

// Types
export interface TransactionData {
  signature: string
  payerPublicKey: string
  serviceFeeSOL: number
  serviceIdentifier: ServiceIdentifier | null
  blockTime: number | null
  slot: number
}

export interface TransactionsData {
  transactions: TransactionData[]
  hasMore: boolean
  lastSignature: string | null
  total: number
}

type TransactionsResponse = ApiResponseBase<TransactionsData>

interface UseAdminTransactionsQueryOptions {
  limit?: number
  before?: string
  serviceFilter?: string
  authSignature: string | null
  authMessage: string | null
  enabled?: boolean
}

export const useAdminTransactionsQuery = ({
  limit = 40,
  before,
  serviceFilter,
  authSignature,
  authMessage,
  enabled = true,
}: UseAdminTransactionsQueryOptions) => {
  const { publicKey } = useWallet()

  // Logger with component context
  const logger = getLogger({
    context: 'hook',
    hook: 'useAdminTransactionsQuery',
    walletAddress: publicKey?.toBase58(),
  })

  // API function to fetch transactions with signature authentication
  const fetchTransactions = useCallback(async (): Promise<TransactionsData> => {
    if (!publicKey || !authSignature || !authMessage) {
      const error = 'Wallet not connected or signature not ready'
      logger.warn(error, {
        hasPublicKey: !!publicKey,
        hasSignature: !!authSignature,
        hasMessage: !!authMessage,
      })
      // Throw proper Solana error with code
      throw new SolanaError('Wallet not connected or signature not ready', SOLANA_ERROR_CODES.WALLET_NOT_CONNECTED, 400)
    }

    const params = new URLSearchParams({
      limit: limit.toString(),
    })

    if (before) params.append('before', before)
    if (serviceFilter && serviceFilter !== 'all') params.append('serviceFilter', serviceFilter)

    try {
      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSignature}`,
          'x-wallet-address': publicKey.toBase58(),
          'x-message': authMessage,
        },
      })

      // Parse the structured API response
      const apiResponse = (await response.json()) as TransactionsResponse

      if (!response.ok) {
        logger.error('API request failed', {
          status: response.status,
          statusText: response.statusText,
          errorCode: apiResponse.error_code,
          errorMessage: apiResponse.error_message,
        })

        // Throw proper error with the error code from the API response
        const errorCode = apiResponse.error_code
        const errorMessage = apiResponse.error_message || `Request failed with status ${response.status}`

        if (errorCode && Object.values(SOLANA_ERROR_CODES).includes(errorCode as keyof typeof SOLANA_ERROR_CODES)) {
          throw new SolanaError(errorMessage, errorCode, response.status)
        } else if (errorCode && Object.values(APP_ERROR_CODES).includes(errorCode as keyof typeof APP_ERROR_CODES)) {
          throw new AppError(errorMessage, errorCode, response.status)
        } else {
          // Fallback to generic HTTP error
          throw new HTTPError(errorMessage, response.status)
        }
      }

      // Use handleApiResponse to process the structured response
      return handleApiResponse(apiResponse)
    } catch (error) {
      logger.error('Transaction fetch failed', error)

      // Re-throw SolanaError and AppError instances as-is
      if (error instanceof SolanaError || error instanceof AppError || error instanceof HTTPError) {
        throw error
      }

      // Handle network/fetch errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new SolanaError('Network connection failed', SOLANA_ERROR_CODES.NETWORK_ERROR, 0)
      }

      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        throw new AppError('Invalid server response', APP_ERROR_CODES.SERVER_ERROR, 500)
      }

      // Generic fallback
      throw new AppError('An unknown error occurred', APP_ERROR_CODES.UNKNOWN_ERROR, 500)
    }
  }, [publicKey, authSignature, authMessage, limit, before, serviceFilter, logger])

  // Query for transactions
  const query = useQuery<TransactionsData, Error>({
    queryKey: ['admin-transactions', serviceFilter, before, publicKey?.toBase58(), authSignature],
    queryFn: fetchTransactions,
    enabled: enabled && !!publicKey && !!authSignature && !!authMessage,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry authentication or authorization errors
      if (error instanceof SolanaError && error.code === SOLANA_ERROR_CODES.WALLET_NOT_CONNECTED) {
        return false
      }

      if (error instanceof SolanaError && error.code === SOLANA_ERROR_CODES.UNAUTHORIZED_OPERATION) {
        return false
      }

      if (error instanceof AppError) {
        if (
          error.code === APP_ERROR_CODES.UNAUTHORIZED ||
          error.code === APP_ERROR_CODES.FORBIDDEN ||
          error.code === APP_ERROR_CODES.TOKEN_EXPIRED ||
          error.code === APP_ERROR_CODES.INVALID_CREDENTIALS
        ) {
          return false
        }
      }

      // Don't retry HTTP errors with 401/403 status
      if (error instanceof HTTPError && (error.status === 401 || error.status === 403)) {
        return false
      }

      // Retry network errors up to 3 times
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return query
}
