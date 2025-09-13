import getStatusCodeFromError from './getStatusCodeFromError'
import getDomainErrorMessage from './getDomainErrorMessage'
import { SolanaError, AppError } from '@/types/error'

const getUserErrorMessageFromError = (error: unknown, errorCode?: string): string => {
  const statusCode = getStatusCodeFromError(error)

  // Extract error code from our custom error types
  let extractedErrorCode = errorCode
  if (error instanceof SolanaError || error instanceof AppError) {
    extractedErrorCode = error.code
  } else if (error instanceof Error && 'code' in error && typeof (error as { code: unknown }).code === 'string') {
    // Fallback for legacy errors that have a code property
    extractedErrorCode = (error as { code: string }).code
  }

  // Extract original error message for more contextual errors
  let originalMessage: string | undefined
  if (error instanceof Error) {
    // If the message is the same as the code, treat as no custom message (show user-friendly message)
    if (error.message === extractedErrorCode) {
      originalMessage = undefined
    } else {
      originalMessage = error.message
    }
  }

  return getDomainErrorMessage(statusCode, extractedErrorCode, originalMessage)
}

export default getUserErrorMessageFromError
