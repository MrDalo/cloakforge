import { ApiResponseBase } from '@/types'
import { getLogger } from '@/lib/logger/logger'
import { handleError } from '@/lib/errors'

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
    logger.error('API Error:', {
      message: response.error_message,
      status: response.status_code,
      code: response.error_code || 'N/A',
    })
    throw new Error(response.error_message || handleError(response))
  }
}
