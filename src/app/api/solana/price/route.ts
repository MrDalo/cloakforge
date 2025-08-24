import { NextResponse } from 'next/server'
import { getCachedSolanaPrice } from '@/lib/solana/priceCache'
import { getLogger } from '@/lib/logger/logger'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import getStatusCodeFromError from '@/lib/utils/getStatusCodeFromError'
import type { ApiResponseBase } from '@/types/error'

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
      logger.warn('Failed to fetch Solana price, returning 0', {
        price,
        action: 'getCachedSolanaPrice',
      })

      return NextResponse.json({
        status: 'success',
        status_code: 200,
        error_message: 'Price data temporarily unavailable',
        data: { price: 0 },
      })
    }
  } catch (error) {
    logger.error('Unexpected error in price API', error, {
      action: 'getCachedSolanaPrice',
    })

    const statusCode = getStatusCodeFromError(error)
    const errorMessage = getUserErrorMessageFromError(error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: errorMessage,
        error_code: APP_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        data: { price: 0 },
      },
      { status: statusCode }
    )
  }
}
