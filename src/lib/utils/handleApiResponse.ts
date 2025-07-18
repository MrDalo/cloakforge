import { ApiResponseBase } from '@/types/error'
import { getLogger } from '@/lib/logger/logger'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'

export const handleApiResponse = <T>(response: ApiResponseBase<T>): T => {
	const logger = getLogger({
		file: 'handleApiResponse.ts',
	})

	if (response.status === 'success') {
		return response.data
	} else {
		logger.error(`API Error: ${response.error_message} (Status: ${response.status_code}, Code: ${response.error_code || 'N/A'})`)
		throw new Error(response.error_message || getUserErrorMessageFromError(response, response.error_code))
	}
}
