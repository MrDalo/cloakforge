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

  return getDomainErrorMessage(statusCode, extractedErrorCode)
}

export default getUserErrorMessageFromError
