import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { PublicKey } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'
import { validateSecurity } from '@/lib/security/originValidator'
import { AppError, handleError } from '@/lib/errors'
import { validateRequestBody } from '@/lib/utils/validateRequestBody'
import type { ApiResponseBase } from '@/types/api'
import { revokeMintAuthorityRequestSchema } from '@/lib/schemas/apiSchemas'
import { createRevokeMintAuthorityTransaction } from '@/lib/solana/server-side/createRevokeMintAuthorityTransaction'

const logger = getLogger({
  context: 'api',
  route: '/api/solana/revoke-mint-authority',
  method: 'POST',
})

// Response type for revoke mint authority
type UnsignedRevokeMintAuthorityResponse = {
  serializedTransaction: string
  message: string
}

/**
 * Server-side Revoke Mint Authority API Route - Prepare Unsigned Transaction Pattern
 *
 * Server focuses on transaction preparation using private RPC and returns unsigned transaction.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponseBase<UnsignedRevokeMintAuthorityResponse>>> {
  try {
    // Privacy-first: Only origin validation
    await validateSecurity(request, {
      skipForLocalhost: true,
    })

    const body = await request.json()

    // Validate request body using Zod schema
    const validation = validateRequestBody(body, revokeMintAuthorityRequestSchema)
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
    let tokenPublicKey: PublicKey

    try {
      walletPublicKey = new PublicKey(validatedData.walletAddress)
      tokenPublicKey = new PublicKey(validatedData.tokenAddress)
    } catch {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Invalid address format',
          error_code: 'INVALID_WALLET_ADDRESS',
          data: null,
        },
        { status: 400 }
      )
    }

    // Create transaction (all business logic validation handled by server-side utility)
    const result = await createRevokeMintAuthorityTransaction({
      walletPublicKey,
      tokenPublicKey,
    })

    const response: UnsignedRevokeMintAuthorityResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      message: `Mint authority revocation transaction prepared successfully for token: ${validatedData.tokenAddress}`,
    }

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: response,
    })
  } catch (error: unknown) {
    logger.error('Revoke mint authority API error', error, {
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

    // Handle all other errors following global error handling strategy
    const userFriendlyMessage = handleError(error, { context: 'revoke-mint-authority' })
    const statusCode = error instanceof AppError ? error.status : 500

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: userFriendlyMessage,
        error_code: 'INTERNAL_ERROR',
        data: null,
      },
      { status: statusCode }
    )
  }
}
