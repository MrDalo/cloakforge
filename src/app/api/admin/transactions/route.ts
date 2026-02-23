import { type NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, LAMPORTS_PER_SOL, type VersionedTransactionResponse, type ConfirmedSignatureInfo } from '@solana/web3.js'
import { SERVICE_IDENTIFIERS, type ServiceIdentifier } from '@/lib/solana/serviceMemo'
import nacl from 'tweetnacl'
import { Buffer } from 'buffer'
import { getLogger } from '@/lib/logger/logger'
import { ERROR_MESSAGES } from '@/lib/errors'
import type { ApiResponseBase } from '@/types'
import getServerConfig from '@/lib/config/getServerConfig'

// Types for our API
interface TransactionData {
  signature: string
  payerPublicKey: string
  serviceFeeSOL: number
  serviceIdentifier: ServiceIdentifier | null
  blockTime: number | null
  slot: number
}

interface TransactionsData {
  transactions: TransactionData[]
  hasMore: boolean
  lastSignature: string | null
  total: number
}

type TransactionsResponse = ApiResponseBase<TransactionsData>

interface SignatureOptions {
  limit: number
  commitment: 'confirmed'
  before?: string
}

// Helper function to verify wallet signature
function verifyWalletSignature(message: string, signature: string, publicKey: string, expectedWallet: string): boolean {
  try {
    // Verify the public key matches our admin wallet
    if (publicKey !== expectedWallet) {
      return false
    }

    // Convert signature from base58 to bytes
    const signatureBytes = Buffer.from(signature, 'base64')
    const messageBytes = Buffer.from(message, 'utf8')
    const publicKeyBytes = new PublicKey(publicKey).toBytes()

    // Verify signature
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes)
  } catch {
    return false
  }
}
function extractServiceIdentifier(logs: string[] | null): ServiceIdentifier | null {
  if (!logs) return null

  // Look for memo program logs that contain our service identifiers
  const memoLogPrefix = 'Program log: Memo (len'
  const serviceIds = Object.values(SERVICE_IDENTIFIERS)

  for (const log of logs) {
    if (log.includes(memoLogPrefix)) {
      // Extract the memo content after the length info
      const memoMatch = log.match(/Memo \(len \d+\): "([^"]+)"/)
      if (memoMatch && memoMatch[1]) {
        const memoContent = memoMatch[1]

        // Check if memo contains any of our service identifiers
        for (const serviceId of serviceIds) {
          if (memoContent.includes(serviceId)) {
            return serviceId
          }
        }
      }
    }
  }

  return null
}

// Helper function to extract service identifier from memo string (from signature info)
function extractServiceIdentifierFromMemo(memo: string): ServiceIdentifier | null {
  if (!memo) return null

  const serviceIds = Object.values(SERVICE_IDENTIFIERS)

  // Check if memo contains any of our service identifiers
  for (const serviceId of serviceIds) {
    if (memo.includes(serviceId)) {
      return serviceId
    }
  }

  return null
}

// Helper function to extract service fee from memo string
function extractServiceFeeFromMemo(memo: string): number {
  if (!memo) return 0

  // Look for patterns like "fee:0.3SOL" or "fee:0.5sol" (case insensitive)
  const feeMatch = memo.match(/fee:(\d+(?:\.\d+)?)SOL/i)
  if (feeMatch && feeMatch[1]) {
    const feeAmount = parseFloat(feeMatch[1])
    return isNaN(feeAmount) ? 0 : feeAmount
  }

  return 0
}

// Helper function to calculate service fee from transaction
function calculateServiceFee(transaction: VersionedTransactionResponse, feeWalletAddress: string): number {
  if (!transaction?.meta?.postBalances || !transaction?.meta?.preBalances) {
    return 0
  }

  // Get account keys from the transaction message
  let accountKeys: PublicKey[] = []
  if (transaction.transaction.message.version === 'legacy') {
    accountKeys = transaction.transaction.message.accountKeys
  } else {
    // For versioned transactions, we need to get account keys differently
    // This is a simplified approach - in production you might want to handle this more robustly
    accountKeys = transaction.transaction.message.staticAccountKeys || []
  }

  const feeWalletIndex = accountKeys.findIndex((key: PublicKey) => key.toString() === feeWalletAddress)

  if (feeWalletIndex === -1) return 0

  const preBalance = transaction.meta.preBalances[feeWalletIndex] || 0
  const postBalance = transaction.meta.postBalances[feeWalletIndex] || 0
  const lamportsReceived = postBalance - preBalance

  return lamportsReceived > 0 ? lamportsReceived / LAMPORTS_PER_SOL : 0
}

// Helper function to get payer from transaction
function getPayerFromTransaction(transaction: VersionedTransactionResponse): string {
  try {
    if (transaction.transaction.message.version === 'legacy') {
      return transaction.transaction.message.accountKeys[0]?.toString() || 'Unknown'
    } else {
      // For versioned transactions
      return transaction.transaction.message.staticAccountKeys?.[0]?.toString() || 'Unknown'
    }
  } catch {
    return 'Unknown'
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger({
    context: 'api',
    route: '/api/admin/transactions',
    method: 'GET',
  })

  try {
    const feeWalletAddress = process.env.FEE_WALLET_ADDRESS
    if (!feeWalletAddress) {
      logger.error('Missing FEE_WALLET_ADDRESS environment variable')
      return NextResponse.json(
        {
          status: 'error',
          status_code: 500,
          error_message: ERROR_MESSAGES.INTERNAL_ERROR,
          error_code: 'INTERNAL_ERROR',
          data: null,
        } satisfies ApiResponseBase<null>,
        { status: 500 }
      )
    }

    // Secure Authentication: Verify wallet signature
    const authHeader = request.headers.get('authorization')
    const walletAddress = request.headers.get('x-wallet-address')
    const messageHeader = request.headers.get('x-message')

    if (!authHeader || !authHeader.startsWith('Bearer ') || !walletAddress || !messageHeader) {
      logger.error('Unauthorized request - missing authentication headers', {
        hasAuthHeader: !!authHeader,
        hasWalletAddress: !!walletAddress,
        hasMessage: !!messageHeader,
      })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 401,
          error_message: ERROR_MESSAGES.UNAUTHORIZED,
          error_code: 'UNAUTHORIZED',
          data: null,
        } satisfies ApiResponseBase<null>,
        { status: 401 }
      )
    }

    const signature = authHeader.replace('Bearer ', '')

    // Verify the signature is valid and from the admin wallet
    const isValidSignature = verifyWalletSignature(messageHeader, signature, walletAddress, feeWalletAddress)

    if (!isValidSignature) {
      logger.error('Invalid signature or unauthorized wallet', {
        walletAddress,
        isAdminWallet: walletAddress === feeWalletAddress,
      })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 403,
          error_message: ERROR_MESSAGES.RPC_CONNECTION_FAILED,
          error_code: 'UNAUTHORIZED',
          data: null,
        } satisfies ApiResponseBase<null>,
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 per request
    const before = searchParams.get('before') || undefined
    const serviceFilter = searchParams.get('serviceFilter') || undefined

    // Get configuration - in production, this should come from environment variables
    const { rpcPrivateEndpoint } = getServerConfig()

    let connection: Connection
    let feeWalletPubkey: PublicKey

    try {
      connection = new Connection(rpcPrivateEndpoint, 'confirmed')
      feeWalletPubkey = new PublicKey(feeWalletAddress)
    } catch (error) {
      logger.error('Failed to initialize Solana connection', error, {
        rpcPrivateEndpoint,
        feeWalletAddress,
      })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 500,
          error_message: ERROR_MESSAGES.RPC_CONNECTION_FAILED,
          error_code: 'RPC_CONNECTION_FAILED',
          data: null,
        } satisfies ApiResponseBase<null>,
        { status: 500 }
      )
    }

    // Step 1: Get transaction signatures for the fee wallet
    const signatureOptions: SignatureOptions = {
      limit,
      commitment: 'confirmed',
    }

    if (before) {
      signatureOptions.before = before
    }

    let signatures: ConfirmedSignatureInfo[]

    try {
      signatures = await connection.getSignaturesForAddress(feeWalletPubkey, signatureOptions)
    } catch (error) {
      logger.error('Failed to fetch transaction signatures', error, {
        walletAddress: feeWalletAddress,
        signatureOptions,
      })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 500,
          error_message: ERROR_MESSAGES.RPC_CONNECTION_FAILED,
          error_code: 'RPC_CONNECTION_FAILED',
          data: null,
        } satisfies ApiResponseBase<null>,
        { status: 500 }
      )
    }

    if (signatures.length === 0) {
      return NextResponse.json({
        status: 'success',
        status_code: 200,
        error_message: '',
        data: {
          transactions: [],
          hasMore: false,
          lastSignature: null,
          total: 0,
        },
      } satisfies TransactionsResponse)
    }

    // Step 2: Batch fetch transaction details
    const signatureStrings = signatures.map((sig) => sig.signature)

    // Batch fetch transactions with proper error handling
    const transactionPromises = signatureStrings.map(async (signature) => {
      try {
        const transaction = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        })
        return { signature, transaction }
      } catch (error) {
        logger.error('Failed to fetch individual transaction', { signature, error: error instanceof Error ? error.message : String(error) })
        return { signature, transaction: null }
      }
    })

    let transactionResults: { signature: string; transaction: VersionedTransactionResponse | null }[]

    try {
      transactionResults = await Promise.all(transactionPromises)
    } catch (error) {
      logger.error('Failed to fetch transaction details', error)
      return NextResponse.json(
        {
          status: 'error',
          status_code: 500,
          error_message: ERROR_MESSAGES.RPC_CONNECTION_FAILED,
          error_code: 'RPC_CONNECTION_FAILED',
          data: null,
        } satisfies ApiResponseBase<null>,
        { status: 500 }
      )
    }

    // Step 3: Process transactions and extract service fee data
    const processedTransactions: TransactionData[] = []

    for (let i = 0; i < transactionResults.length; i++) {
      const { signature, transaction } = transactionResults[i]
      const signatureInfo = signatures[i] // Get the corresponding signature info

      if (!transaction) continue

      // Extract service identifier from signature memo first (more reliable)
      let serviceIdentifier: ServiceIdentifier | null = null
      let serviceFeeSOL = 0

      if (signatureInfo?.memo) {
        serviceIdentifier = extractServiceIdentifierFromMemo(signatureInfo.memo)
        // Extract fee from memo if available
        serviceFeeSOL = extractServiceFeeFromMemo(signatureInfo.memo)
      }

      // If not found in memo, try transaction logs as fallback
      if (!serviceIdentifier) {
        serviceIdentifier = extractServiceIdentifier(transaction.meta?.logMessages || null)
      }

      // If fee not found in memo, try calculating from transaction balances
      if (serviceFeeSOL === 0) {
        serviceFeeSOL = calculateServiceFee(transaction, feeWalletAddress)
      }

      // Only include transactions with service identifiers (our service fees)
      if (!serviceIdentifier) continue

      // Apply service filter if specified
      if (serviceFilter && serviceIdentifier !== serviceFilter) continue

      // Skip if no service fee was received (allow 0 for testing purposes)
      // if (serviceFeeSOL <= 0) continue

      // Get payer address
      const payerPublicKey = getPayerFromTransaction(transaction)

      processedTransactions.push({
        signature,
        payerPublicKey,
        serviceFeeSOL,
        serviceIdentifier,
        blockTime: transaction.blockTime ?? null,
        slot: transaction.slot,
      })
    }

    // Sort by slot descending (newest first)
    processedTransactions.sort((a, b) => b.slot - a.slot)

    const responseData: TransactionsData = {
      transactions: processedTransactions,
      hasMore: signatures.length === limit,
      lastSignature: signatures[signatures.length - 1]?.signature || null,
      total: processedTransactions.length,
    }

    const response: TransactionsResponse = {
      status: 'success',
      status_code: 200,
      error_message: '',
      data: responseData,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Error fetching admin transactions', error, {
      requestId: request.headers.get('x-request-id'),
      walletAddress: request.headers.get('x-wallet-address'),
    })

    // Determine the appropriate error response based on the error type
    let errorCode = 'INTERNAL_ERROR'
    let statusCode = 500

    if (error instanceof Error) {
      // Check for specific Solana RPC errors
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        errorCode = 'RPC_RATE_LIMITED'
        statusCode = 429
      } else if (error.message.includes('connection') || error.message.includes('network')) {
        errorCode = 'RPC_CONNECTION_FAILED'
        statusCode = 503
      } else if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
        errorCode = 'FORBIDDEN'
        statusCode = 403
      }
    }

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.INTERNAL_ERROR,
        error_code: errorCode,
        data: null,
      } satisfies ApiResponseBase<null>,
      { status: statusCode }
    )
  }
}
