import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { getAccount } from '@solana/spl-token'
import getServerConfig from '@/lib/config/getServerConfig'
import { getLogger } from '@/lib/logger/logger'
import { validateSecurity } from '@/lib/security/originValidator'
import { AppError, SolanaError } from '@/types/error'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { createBurnTokenTransaction } from '@/lib/solana/createBurnTokenTransaction'
import { burnTokensRequestSchema } from '@/lib/schemas/apiSchemas'
import { validateRequestBody } from '@/lib/utils/validateRequestBody'
import type { UnsignedBurnTransactionResponse, ApiResponseBase } from '@/types'

const logger = getLogger({
  context: 'api',
  route: '/api/solana/burn-tokens',
  method: 'POST',
})

/**
 * Server-side Burn Tokens API Route - Prepare Unsigned Transaction Pattern
 * Validates token ownership and balance, then creates unsigned burn transaction for client-side signing
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponseBase<UnsignedBurnTransactionResponse>>> {
  try {
    // Privacy-first: Only origin validation
    await validateSecurity(request, {
      skipForLocalhost: true,
    })

    const body = await request.json()
    const serverConfig = getServerConfig()

    // Validate request body using Zod schema
    const validation = validateRequestBody(body, burnTokensRequestSchema)
    if (!validation.success) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: `Validation failed: ${validation.errors}`,
          error_code: APP_ERROR_CODES.INVALID_INPUT,
          data: null,
        },
        { status: 400 }
      )
    }
    const validatedData = validation.data

    // Validate addresses format (additional layer using Solana's PublicKey validation)
    let walletPublicKey: PublicKey
    let tokenAccountPublicKey: PublicKey
    let mintPublicKey: PublicKey

    try {
      walletPublicKey = new PublicKey(validatedData.walletAddress)
      tokenAccountPublicKey = new PublicKey(validatedData.tokenAccountAddress)
      mintPublicKey = new PublicKey(validatedData.mintAddress)
    } catch {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Invalid address format for wallet, token account, or mint',
          error_code: SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS,
          data: null,
        },
        { status: 400 }
      )
    }

    logger.info('Burn tokens transaction preparation request', {
      walletAddress: validatedData.walletAddress,
      tokenAccount: validatedData.tokenAccountAddress,
      mint: validatedData.mintAddress,
      amount: validatedData.amount,
      decimals: validatedData.decimals,
      tokenSymbol: validatedData.tokenSymbol,
    })

    // Create secure connection using private RPC endpoint for fast, reliable validation
    const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')

    // Server-side validation (critical for security)
    try {
      // 1. Validate token account exists and ownership
      const tokenAccountInfo = await getAccount(connection, tokenAccountPublicKey)

      // Check ownership
      if (tokenAccountInfo.owner.toString() !== walletPublicKey.toString()) {
        logger.warn('Token account ownership mismatch', {
          tokenAccount: validatedData.tokenAccountAddress,
          actualOwner: tokenAccountInfo.owner.toString(),
          claimedOwner: validatedData.walletAddress,
        })

        return NextResponse.json(
          {
            status: 'error',
            status_code: 403,
            error_message: 'You do not own this token account',
            error_code: SOLANA_ERROR_CODES.UNAUTHORIZED_OPERATION,
            data: null,
          },
          { status: 403 }
        )
      }

      // Check mint match
      if (tokenAccountInfo.mint.toString() !== mintPublicKey.toString()) {
        return NextResponse.json(
          {
            status: 'error',
            status_code: 400,
            error_message: 'Token account mint does not match provided mint address',
            error_code: SOLANA_ERROR_CODES.INVALID_MINT_ADDRESS,
            data: null,
          },
          { status: 400 }
        )
      }

      // Calculate raw amount for validation (amount * 10^decimals)
      const rawAmount = BigInt(Math.floor(validatedData.amount * Math.pow(10, validatedData.decimals)))

      // Check sufficient balance
      if (tokenAccountInfo.amount < rawAmount) {
        logger.warn('Insufficient token balance', {
          tokenAccount: validatedData.tokenAccountAddress,
          available: tokenAccountInfo.amount.toString(),
          requested: rawAmount.toString(),
          tokenSymbol: validatedData.tokenSymbol,
        })

        return NextResponse.json(
          {
            status: 'error',
            status_code: 400,
            error_message: `Insufficient balance. Available: ${Number(tokenAccountInfo.amount) / Math.pow(10, validatedData.decimals)}, Requested: ${validatedData.amount}`,
            error_code: SOLANA_ERROR_CODES.INSUFFICIENT_TOKEN_BALANCE,
            data: null,
          },
          { status: 400 }
        )
      }

      logger.info('Token account validation successful', {
        tokenAccount: validatedData.tokenAccountAddress,
        balance: tokenAccountInfo.amount.toString(),
        burnAmount: rawAmount.toString(),
        owner: tokenAccountInfo.owner.toString(),
      })

      // Check wallet SOL balance for transaction fees
      const walletBalance = await connection.getBalance(walletPublicKey)
      const walletBalanceSOL = walletBalance / 1e9
      const estimatedCostSOL = 0.00001 // Conservative estimate for burn transaction

      if (walletBalanceSOL < estimatedCostSOL) {
        return NextResponse.json(
          {
            status: 'error',
            status_code: 400,
            error_message: `Insufficient SOL for transaction fees. Need at least ${estimatedCostSOL} SOL`,
            error_code: SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS,
            data: null,
          },
          { status: 400 }
        )
      }

      // Create burn transaction using our utility
      const burnResult = await createBurnTokenTransaction({
        walletPublicKey,
        tokenAccountAddress: validatedData.tokenAccountAddress,
        amount: validatedData.amount,
        mintAddress: validatedData.mintAddress,
        decimals: validatedData.decimals,
      })

      // Serialize the transaction for client-side signing
      const serializedTransaction = Buffer.from(burnResult.transaction.serialize({ requireAllSignatures: false })).toString('base64')

      const response: UnsignedBurnTransactionResponse = {
        serializedTransaction,
        rawAmount: burnResult.rawAmount,
        uiAmount: burnResult.uiAmount,
        tokenAccount: burnResult.tokenAccount,
        mint: burnResult.mint,
        message: `Ready to burn ${burnResult.uiAmount} ${validatedData.tokenSymbol || 'tokens'}`,
      }

      logger.info('Burn transaction preparation completed successfully', {
        tokenAccount: validatedData.tokenAccountAddress,
        burnAmount: validatedData.amount,
        tokenSymbol: validatedData.tokenSymbol,
      })

      return NextResponse.json({
        status: 'success',
        status_code: 200,
        error_message: '',
        data: response,
      })
    } catch (accountError) {
      // Handle token account not found or other account-related errors
      logger.warn('Token account validation failed', {
        error: accountError,
        tokenAccount: validatedData.tokenAccountAddress,
        mint: validatedData.mintAddress,
      })

      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Token account not found or invalid',
          error_code: SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND,
          data: null,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    // Handle origin validation errors
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: error.status,
          error_message: error.message,
          error_code: error.code,
          data: null,
        },
        { status: error.status }
      )
    }

    // Handle Solana-specific errors
    if (error instanceof SolanaError) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: error.status,
          error_message: error.message,
          error_code: error.code,
          data: null,
        },
        { status: error.status }
      )
    }

    logger.error('Burn tokens API error', error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: 'Internal server error during burn preparation',
        error_code: APP_ERROR_CODES.INTERNAL_ERROR,
        data: null,
      },
      { status: 500 }
    )
  }
}
