import { NextResponse } from 'next/server'
import { getCachedSiteBanner } from '@/lib/contentful/siteBannerCache'
import { getLogger } from '@/lib/logger/logger'
import { AppError, handleError } from '@/lib/errors'
import type { ApiResponseBase } from '@/types'

interface SiteBannerData {
  banner: unknown | null
}

export async function GET(): Promise<NextResponse<ApiResponseBase<SiteBannerData>>> {
  const logger = getLogger({
    context: 'api',
    route: '/api/site-banner',
    method: 'GET',
  })

  try {
    const banner = await getCachedSiteBanner()

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: { banner },
    })
  } catch (error) {
    logger.error('Failed to fetch site banner', error, {
      action: 'getCachedSiteBanner',
    })

    const statusCode = error instanceof AppError ? error.status : 500
    const errorMessage = handleError(error, { context: 'api' })

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: errorMessage,
        error_code: 'SERVICE_UNAVAILABLE',
        data: { banner: null },
      },
      { status: statusCode }
    )
  }
}
