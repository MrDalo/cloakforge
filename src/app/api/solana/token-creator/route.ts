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
import type { UnsignedTokenCreationResponse, ApiResponseBase } from '@/types/api'
import { createTokenCreationTransaction } from '@/lib/solana/createTokenCreationTransaction'

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

    // Validate request body using Zod schema
    const validation = validateRequestBody(body, tokenCreatorRequestSchema)
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

    // Validate wallet address format (additional layer using Solana's PublicKey validation)
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

    logger.info('Token creation transaction preparation request', {
      walletAddress: validatedData.walletAddress,
      tokenName: validatedData.tokenData.name,
      tokenSymbol: validatedData.tokenData.symbol,
      totalSupply: validatedData.tokenData.totalSupply,
      decimals: validatedData.tokenData.decimals,
      hasMetadata: !!validatedData.metadata,
      hasMetadataUri: !!validatedData.metadata?.metadataUri,
    })

    // Use client-provided metadata URI (metadata creation now handled client-side)
    const metadataUri = validatedData.metadata?.metadataUri

    if (metadataUri) {
      logger.info('Using client-provided metadata URI', {
        metadataUri,
        tokenSymbol: validatedData.tokenData.symbol,
      })
    }

    // Prepare the transaction (balance validation already done client-side)
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

    logger.error('Token creation API error', error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: 'Internal server error during token creation',
        error_code: APP_ERROR_CODES.INTERNAL_ERROR,
        data: null,
      },
      { status: 500 }
    )
  }
}
