import { NextResponse } from 'next/server'
import { getSiteBanner } from '@/lib/contentful/client'
import { getLogger } from '@/lib/logger/logger'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import getStatusCodeFromError from '@/lib/utils/getStatusCodeFromError'
import type { ApiResponseBase } from '@/types/error'

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
    const banner = await getSiteBanner()

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: { banner },
    })
  } catch (error) {
    logger.error('Failed to fetch site banner', error, {
      action: 'getSiteBanner',
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
