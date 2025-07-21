import getStatusCodeFromError from './getStatusCodeFromError'
import getDomainErrorMessage from './getDomainErrorMessage'

const getUserErrorMessageFromError = (error: unknown, errorCode?: string): string => {
  const statusCode = getStatusCodeFromError(error)
  return getDomainErrorMessage(statusCode, errorCode)
}

export default getUserErrorMessageFromError
