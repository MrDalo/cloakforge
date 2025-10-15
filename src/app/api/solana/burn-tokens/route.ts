import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { PublicKey } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'
import { validateSecurity } from '@/lib/security/originValidator'
import { AppError, handleError } from '@/lib/errors'
import { createBurnTokenTransaction } from '@/lib/solana/server-side/createBurnTokenTransaction'
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
 * Follows comprehensive error handling strategy from Token Creator implementation
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponseBase<UnsignedBurnTransactionResponse>>> {
  try {
    // Privacy-first: Only origin validation
    await validateSecurity(request, {
      skipForLocalhost: true,
    })

    const body = await request.json()

    // Validate request body using Zod schema (all business logic validation handled here)
    const validation = validateRequestBody(body, burnTokensRequestSchema)
    if (!validation.success) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: `Validation failed: ${validation.errors}`,
          error_code: 'INVALID_INPUT',
          data: null,
        },
        { status: 400 }
      )
    }
    const validatedData = validation.data

    // Additional Solana-specific address validation
    let walletPublicKey: PublicKey

    try {
      walletPublicKey = new PublicKey(validatedData.walletAddress)
      // Basic validation for other addresses
      new PublicKey(validatedData.tokenAccountAddress)
      new PublicKey(validatedData.mintAddress)
    } catch {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Invalid address format for wallet, token account, or mint',
          error_code: 'INVALID_WALLET_ADDRESS',
          data: null,
        },
        { status: 400 }
      )
    }

    // Create burn transaction (all business logic validation already handled by Zod schema)
    const result = await createBurnTokenTransaction({
      walletPublicKey,
      tokenAccountAddress: validatedData.tokenAccountAddress,
      amount: validatedData.amount,
      mintAddress: validatedData.mintAddress,
      decimals: validatedData.decimals,
    })

    const response: UnsignedBurnTransactionResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      rawAmount: result.rawAmount,
      uiAmount: result.uiAmount,
      tokenAccount: result.tokenAccount,
      mint: result.mint,
      message: `Ready to burn ${result.uiAmount} ${validatedData.tokenSymbol || 'tokens'}`,
    }

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: response,
    })
  } catch (error: unknown) {
    logger.error('Burn tokens API error', error, {
      wallet: request.headers.get('user-agent') ? 'present' : 'missing',
    })

    // **GLOBAL ERROR HANDLING STRATEGY IMPLEMENTATION**

    // Handle security validation errors (AppError)
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

    // Handle AppError instances
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

    // Handle all other errors using global error handling strategy
    const userFriendlyMessage = handleError(error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: userFriendlyMessage,
        error_code: 'INTERNAL_ERROR',
        data: null,
      },
      { status: 500 }
    )
  }
}
