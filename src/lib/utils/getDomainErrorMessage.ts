import { SOLANA_ERROR_CODES, type SolanaErrorCode } from './solanaErrorCodes'
import { isAppErrorCode } from './appErrorCodes'
import getUserErrorMessageFromStatusCode from './getUserErrorMessageFromStatusCode'
import getAppErrorMessage from './getAppErrorMessage'
import getSolanaErrorMessage from './getSolanaErrorMessage'

/**
 * Get domain-specific error messages based on error codes
 * This function supports multiple domains: generic app errors and Solana-specific errors
 */
const getDomainErrorMessage = (statusCode: number, errorCode?: string): string => {
	// Return generic HTTP message if no error code provided
	if (!errorCode) {
		return getUserErrorMessageFromStatusCode(statusCode)
	}

	// Check if it's a generic app error code (most common)
	if (isAppErrorCode(errorCode)) {
		return getAppErrorMessage(errorCode)
	}

	// Check if it's a Solana-specific error code
	if (Object.values(SOLANA_ERROR_CODES).includes(errorCode as SolanaErrorCode)) {
		return getSolanaErrorMessage(statusCode, errorCode)
	}

	// Add other domain-specific error handling here in the future
	// if (isStripeErrorCode(errorCode)) {
	//   return getStripeErrorMessage(statusCode, errorCode)
	// }
	// if (isAuthErrorCode(errorCode)) {
	//   return getAuthErrorMessage(statusCode, errorCode)
	// }

	// Fall back to generic HTTP status code message for unknown error codes
	return getUserErrorMessageFromStatusCode(statusCode)
}

export default getDomainErrorMessage
