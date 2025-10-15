import { NextResponse } from 'next/server'
import { getCachedSolanaPrice } from '@/lib/solana/server-side/priceCache'
import { getLogger } from '@/lib/logger/logger'
import { AppError, handleError } from '@/lib/errors'
import type { ApiResponseBase } from '@/types'

interface SolanaPriceData {
  price: number
}

export async function GET(): Promise<NextResponse<ApiResponseBase<SolanaPriceData>>> {
  const logger = getLogger({
    context: 'api',
    route: '/api/solana/price',
    method: 'GET',
  })

  try {
    const price = await getCachedSolanaPrice()

    if (price > 0) {
      return NextResponse.json({
        status: 'success',
        status_code: 200,
        error_message: '',
        data: { price },
      })
    } else {
      logger.error('Failed to fetch Solana price, all sources failed', {
        price,
        action: 'getCachedSolanaPrice',
      })

      return NextResponse.json(
        {
          status: 'error',
          status_code: 503,
          error_message: 'Price data temporarily unavailable. Please try again later.',
          error_code: 'SERVICE_UNAVAILABLE',
          data: { price: 0 },
        },
        { status: 503 }
      )
    }
  } catch (error) {
    logger.error('Unexpected error in price API', error, {
      action: 'getCachedSolanaPrice',
    })

    const statusCode = error instanceof AppError ? error.status : 500
    const errorMessage = handleError(error, { context: 'api' })

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: errorMessage,
        error_code: 'SERVICE_UNAVAILABLE',
        data: { price: 0 },
      },
      { status: statusCode }
    )
  }
}
