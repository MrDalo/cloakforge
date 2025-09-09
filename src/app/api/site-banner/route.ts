import { NextResponse } from 'next/server'
import { getCachedSiteBanner } from '@/lib/contentful/siteBannerCache'
import { getLogger } from '@/lib/logger/logger'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import getStatusCodeFromError from '@/lib/utils/getStatusCodeFromError'
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

    const statusCode = getStatusCodeFromError(error)
    const errorMessage = getUserErrorMessageFromError(error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: errorMessage,
        error_code: APP_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        data: { banner: null },
      },
      { status: statusCode }
    )
  }
}
