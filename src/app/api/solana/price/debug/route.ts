import { NextResponse } from 'next/server'
import { getSolanaPriceCacheInfo, clearSolanaPriceCache } from '@/lib/solana/priceCache'
import { getLogger } from '@/lib/logger/logger'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import getStatusCodeFromError from '@/lib/utils/getStatusCodeFromError'
import type { ApiResponseBase } from '@/types/error'

interface CacheDebugData {
  cache: ReturnType<typeof getSolanaPriceCacheInfo>
  timestamp: string
}

interface CacheClearData {
  message: string
  timestamp: string
}

export async function GET(): Promise<NextResponse<ApiResponseBase<CacheDebugData>>> {
  const logger = getLogger({
    context: 'api',
    route: '/api/solana/price/debug',
    method: 'GET',
  })

  try {
    const cacheInfo = getSolanaPriceCacheInfo()

    logger.info('Solana price cache debug info requested', cacheInfo)

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: {
        cache: cacheInfo,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error getting cache debug info', error, {
      action: 'getSolanaPriceCacheInfo',
    })

    const statusCode = getStatusCodeFromError(error)
    const errorMessage = getUserErrorMessageFromError(error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: errorMessage,
        error_code: APP_ERROR_CODES.INTERNAL_ERROR,
        data: {
          cache: {
            hasCache: false,
            cacheAge: 0,
            price: 0,
            source: '',
            lastFetch: '',
            cacheExpiry: '',
          },
          timestamp: new Date().toISOString(),
        },
      },
      { status: statusCode }
    )
  }
}

export async function DELETE(): Promise<NextResponse<ApiResponseBase<CacheClearData>>> {
  const logger = getLogger({
    context: 'api',
    route: '/api/solana/price/debug',
    method: 'DELETE',
  })

  try {
    clearSolanaPriceCache()
    logger.info('Solana price cache cleared via API')

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: {
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Error clearing cache', error, {
      action: 'clearSolanaPriceCache',
    })

    const statusCode = getStatusCodeFromError(error)
    const errorMessage = getUserErrorMessageFromError(error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: errorMessage,
        error_code: APP_ERROR_CODES.INTERNAL_ERROR,
        data: {
          message: 'Failed to clear cache',
          timestamp: new Date().toISOString(),
        },
      },
      { status: statusCode }
    )
  }
}
