/**
 * Fresh Transaction API Route
 *
 * Provides ultra-fresh transactions right before wallet signing to minimize
 * timing issues that cause Phantom wallet simulation warnings.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Connection, Transaction, PublicKey } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'
import { refreshTransactionForWallet } from '@/lib/solana/freshTransaction'
import getServerConfig from '@/lib/config/getServerConfig'

const refreshTransactionSchema = z.object({
  serializedTransaction: z.string().min(1, 'Transaction data is required'),
  walletAddress: z.string().min(1, 'Wallet address is required'),
})

interface RefreshTransactionResponse {
  serializedTransaction: string
  refreshed: boolean
  timingInfo: {
    originalBlockhash: string
    freshBlockhash: string
    refreshTimeMs: number
  }
  message: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger({
    context: 'api',
    route: '/api/solana/refresh-transaction',
    method: 'POST',
  })

  try {
    const body = await request.json()
    const validatedData = refreshTransactionSchema.parse(body)

    // Deserialize the original transaction
    const originalTransaction = Transaction.from(Buffer.from(validatedData.serializedTransaction, 'base64'))

    const walletPublicKey = new PublicKey(validatedData.walletAddress)

    // Create connection using server RPC
    const serverConfig = getServerConfig()
    const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')

    // Refresh the transaction with ultra-fresh blockhash
    const refreshResult = await refreshTransactionForWallet(originalTransaction, connection, walletPublicKey)

    if (!refreshResult.success) {
      logger.warn('Failed to refresh transaction', {
        error: refreshResult.error,
        wallet: validatedData.walletAddress,
        timingInfo: refreshResult.timingInfo,
      })

      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: refreshResult.error || 'Failed to refresh transaction',
          data: null,
        },
        { status: 400 }
      )
    }

    logger.info('Transaction refreshed successfully', {
      wallet: validatedData.walletAddress,
      refreshTimeMs: refreshResult.timingInfo?.refreshTimeMs,
      blockhashChanged: refreshResult.timingInfo?.originalBlockhash !== refreshResult.timingInfo?.freshBlockhash,
    })

    const response: RefreshTransactionResponse = {
      serializedTransaction: Buffer.from(refreshResult.transaction!.serialize({ requireAllSignatures: false })).toString('base64'),
      refreshed: true,
      timingInfo: refreshResult.timingInfo!,
      message: 'Transaction refreshed with latest blockhash',
    }

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: response,
    })
  } catch (error) {
    logger.error('Refresh transaction API error', error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: 'Internal server error',
        data: null,
      },
      { status: 500 }
    )
  }
}
