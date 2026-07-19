import { type ApiResponseBase } from '@/types'
import { getLogger } from '@/lib/logger/logger'
import { handleError } from '@/lib/errors'

/**
 * Normalizes API wrapper responses into typed data or throws a meaningful error.
 *
 * @param response - API response envelope.
 * @returns Parsed response data when status is success.
 * @throws Error when response is unsuccessful or contains invalid success payload.
 */
export const handleApiResponse = <T>(response: ApiResponseBase<T>): T => {
  const logger = getLogger({
    file: 'handleApiResponse.ts',
  })

  if (response.status === 'success') {
    // For success responses, data should not be null
    if (response.data === null) {
      logger.error('API Success response with null data:', {
        status: response.status_code,
        message: response.error_message,
      })
      throw new Error('API returned success status but no data')
    }
    return response.data
  } else {
    // Expected/client-driven failures (status < 500) already got their due attention
    // at the API boundary (createApiRoute) — don't log them again at error level here.
    const logFn = response.status_code && response.status_code < 500 ? logger.warn : logger.error
    logFn('API Error:', undefined, {
      message: response.error_message,
      status: response.status_code,
      code: response.error_code || 'N/A',
    })
    throw new Error(response.error_message || handleError(response))
  }
}
