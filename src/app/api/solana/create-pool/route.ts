import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { validateSecurity } from '@/lib/security/originValidator'
import { validateRequestBody } from '@/lib/utils/validateRequestBody'
import { createPoolSchema } from '@/lib/schemas/createLiquiditySchema'
import { createPoolTransaction } from '@/lib/solana/raydium/pool'
import { getLogger } from '@/lib/logger/logger'
import getServerConfig from '@/lib/config/getServerConfig'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '@/lib/solana/serviceMemo'
import { ApiResponseBase } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponseBase<unknown>>> {
  const logger = getLogger({ context: 'api', route: '/api/solana/create-pool' })

  try {
    // 1. Security validation
    await validateSecurity(request, { skipForLocalhost: true })

    // 2. Request validation
    const body = await request.json()
    const validation = validateRequestBody(body, createPoolSchema)

    if (!validation.success) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: `Validation failed: ${validation.errors}`,
          data: null,
        },
        { status: 400 }
      )
    }

    // 3. Setup Connection
    const serverConfig = getServerConfig()
    const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')

    const walletAddress = body.walletAddress
    if (!walletAddress) {
      throw new Error('Wallet address is required')
    }
    const walletPublicKey = new PublicKey(walletAddress)

    // 4. Create Transaction
    const result = await createPoolTransaction(connection, walletPublicKey, validation.data)

    // 5. Add Service Fee & Memo
    // Fetch tool config for dynamic fee
    let serviceFeeSOL = 0.1 // Default fallback
    try {
      const toolConfig = await getCachedToolConfig('create-liquidity')
      if (toolConfig) {
        serviceFeeSOL = toolConfig.baseFee
      }
    } catch (error) {
      logger.warn('Failed to fetch tool config, using default fee', { error })
    }

    const finalTransaction = result.transaction

    // Add Memo
    finalTransaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.CREATE_LIQUIDITY))

    // Add Fee Transfer
    if (serviceFeeSOL > 0) {
      finalTransaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: new PublicKey(serverConfig.feeWalletAddress),
          lamports: Math.round(serviceFeeSOL * LAMPORTS_PER_SOL),
        })
      )
    }

    // 6. Serialize Response
    const signers = result.signers.map((s) => Array.from(s.secretKey))

    const serializedTransaction = finalTransaction
      .serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      })
      .toString('base64')

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: {
        transaction: serializedTransaction,
        signers,
      },
    })
  } catch (error) {
    logger.error('API error', error)
    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      },
      { status: 500 }
    )
  }
}
