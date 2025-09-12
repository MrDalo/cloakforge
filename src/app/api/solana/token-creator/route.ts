import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { PublicKey } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'
import { validateSecurity } from '@/lib/security/originValidator'
import { AppError, SolanaError } from '@/types/error'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { tokenCreatorRequestSchema } from '@/lib/schemas/apiSchemas'
import { validateRequestBody } from '@/lib/utils/validateRequestBody'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import type { UnsignedTokenCreationResponse, ApiResponseBase } from '@/types/api'
import { createTokenCreationTransaction } from '@/lib/solana/server-side/createTokenCreationTransaction'

const logger = getLogger({
  context: 'api',
  route: '/api/solana/token-creator',
  method: 'POST',
})

/**
 * Server-side Token Creator API Route - Prepare Unsigned Transaction Pattern
 *
 * Client handles IPFS uploads and metadata creation for better performance.
 * Server focuses on transaction preparation using private RPC and returns unsigned transaction.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponseBase<UnsignedTokenCreationResponse>>> {
  try {
    // Privacy-first: Only origin validation
    await validateSecurity(request, {
      skipForLocalhost: true,
    })

    const body = await request.json()

    // Validate request body using Zod schema (all business logic validation handled here)
    const validation = validateRequestBody(body, tokenCreatorRequestSchema)
    if (!validation.success) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: `Validation failed: ${validation.errors}`,
          error_code: APP_ERROR_CODES.VALIDATION_ERROR,
          data: null,
        },
        { status: 400 }
      )
    }
    const validatedData = validation.data

    // Additional Solana-specific wallet address validation
    let walletPublicKey: PublicKey
    try {
      walletPublicKey = new PublicKey(validatedData.walletAddress)
    } catch {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Invalid wallet address format',
          error_code: SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS,
          data: null,
        },
        { status: 400 }
      )
    }

    // Use client-provided metadata URI (metadata creation handled client-side)
    const metadataUri = validatedData.metadata?.metadataUri

    // Create transaction (all business logic validation already handled by Zod schema)
    const result = await createTokenCreationTransaction({
      walletPublicKey,
      tokenData: validatedData.tokenData,
      metadataUri, // Now we have the actual IPFS metadata URI
    })

    const response: UnsignedTokenCreationResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      mintPublicKey: result.mintPublicKey,
      mintSecretKey: Array.from(result.mintKeypair.secretKey), // Include secret key for client-side signing
      message: `Token creation transaction prepared successfully. Mint: ${result.mintPublicKey}`,
    }

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: response,
    })
  } catch (error: unknown) {
    logger.error('Token creation API error', error, {
      wallet: request.headers.get('user-agent') ? 'present' : 'missing',
    })

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

    // Handle Solana-specific errors (SolanaError)
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

    // Handle all other errors following global error handling strategy
    const userFriendlyMessage = getUserErrorMessageFromError(error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: userFriendlyMessage,
        error_code: APP_ERROR_CODES.INTERNAL_ERROR,
        data: null,
      },
      { status: 500 }
    )
  }
}
