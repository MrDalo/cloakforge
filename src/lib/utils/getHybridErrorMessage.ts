import getUserErrorMessageFromStatusCode from './getUserErrorMessageFromStatusCode'

interface HybridErrorMessageOptions {
  statusCode: number
  errorCode?: string
  originalMessage?: string
  codeToMessageMap: Record<string, string>
}

/**
 * Unified hybrid error message resolver for both AppError and SolanaError
 * 1. If a custom message is provided, show it
 * 2. If not, show the user-friendly message for the code
 * 3. If code is not found, fallback to HTTP status message
 */
const getHybridErrorMessage = ({ statusCode, errorCode, originalMessage, codeToMessageMap }: HybridErrorMessageOptions): string => {
  if (!errorCode) {
    return getUserErrorMessageFromStatusCode(statusCode)
  }
  if (originalMessage && originalMessage.trim()) {
    return originalMessage
  }
  if (errorCode in codeToMessageMap) {
    return codeToMessageMap[errorCode]
  }
  return getUserErrorMessageFromStatusCode(statusCode)
}

export default getHybridErrorMessage
