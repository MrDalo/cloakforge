/**
 * API Route: Wallet Tokens
 *
 * Server-side endpoint to fetch wallet tokens with metadata using private RPC.
 * Supports tool-specific filtering to minimize data transfer and improve performance.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getLogger } from '@/lib/logger/logger'
import { validateSecurity } from '@/lib/security/originValidator'
import { AppError, handleError } from '@/lib/errors'
import { validateRequestBody } from '@/lib/utils/validateRequestBody'
import type { ApiResponseBase } from '@/types'
import { shouldIncludeAuthorities } from '@/lib/utils/toolHelpers'
import {
  getWalletTokensWithMetadataServer,
  type ServerWalletTokensResult,
  type ServerToolType,
} from '@/lib/solana/server-side/getWalletTokensServer'

// Request/Response schemas
const walletTokensRequestSchema = z.object({
  walletAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid wallet address'),
  toolType: z
    .enum([
      'burn-tokens',
      'revoke-mint-authority',
      'revoke-freeze-authority',
      'freeze-accounts',
      'unfreeze-accounts',
      'create-liquidity',
      'token-creator',
      'token-auditor',
      'transaction-multisender',
      'all',
      'default',
    ])
    .optional()
    .default('all'),
  nonZeroOnly: z.boolean().optional().default(true),
  includeToken2022: z.boolean().optional().default(true),
  includeAuthorities: z.boolean().optional().default(false),
  includeImages: z.boolean().optional().default(false),
  commitment: z.enum(['finalized', 'confirmed', 'processed']).optional().default('confirmed'),
})

export type WalletTokensRequest = z.infer<typeof walletTokensRequestSchema>

export interface WalletTokensResponse {
  tokens: ServerWalletTokensResult
}

/**
 * POST /api/solana/wallet-tokens
 *
 * Fetches wallet tokens with metadata using server-side private RPC
 * Supports tool-specific filtering for optimal performance
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponseBase<WalletTokensResponse>>> {
  const logger = getLogger({
    context: 'api-wallet-tokens',
    function: 'POST',
  })

  try {
    // Privacy-first: Only origin validation
    await validateSecurity(request, {
      skipForLocalhost: true,
    })

    const body = await request.json()

    // Validate request body using Zod schema (all business logic validation handled here)
    const validation = validateRequestBody(body, walletTokensRequestSchema)
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
    const validatedBody = validation.data

    const { walletAddress, toolType, nonZeroOnly, includeToken2022, includeAuthorities, includeImages, commitment } = validatedBody

    // Determine if we need authorities based on tool type
    const needsAuthorities = includeAuthorities || shouldIncludeAuthorities(toolType)

    // Fetch wallet tokens using server-side utility
    const tokensResult = await getWalletTokensWithMetadataServer(walletAddress, {
      toolType: toolType as ServerToolType,
      nonZeroOnly,
      includeToken2022,
      includeAuthorities: needsAuthorities,
      includeImages,
      commitment,
    })

    const response: WalletTokensResponse = {
      tokens: tokensResult,
    }

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: response,
    })
  } catch (error: unknown) {
    if (error instanceof AppError) {
      logger.error('Known error in wallet tokens API', error)
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

    if (error instanceof AppError) {
      logger.error('Known error in wallet tokens API', error)
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

    const enhancedError = new AppError('INTERNAL_ERROR', 'Failed to fetch wallet tokens')
    const userMessage = handleError(error)

    logger.error('Unknown error in wallet tokens API', enhancedError, {
      originalError: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: userMessage,
        error_code: 'INTERNAL_ERROR',
        data: null,
      },
      { status: 500 }
    )
  }
}
