const getUserErrorMessageFromStatusCode = (statusCode: number): string => {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'You need to be logged in to continue.',
    403: 'You do not have permission to access this resource.',
    404: 'The requested data could not be found.',
    405: 'The requested method is not allowed.',
    408: 'The request took too long to complete. Please try again.',
    409: 'There was a conflict with your request. Please try again.',
    413: 'The request data is too large.',
    415: 'Unsupported media type. Please check your request.',
    422: 'The data provided is invalid or incomplete.',
    429: 'Too many requests. Please slow down and try again later.',
    500: 'Something went wrong on our end. Please try again later.',
    501: 'This functionality is currently not supported.',
    502: 'Bad gateway. Please try again later.',
    503: 'The service is temporarily unavailable. Please try again later.',
    504: 'The request timed out. Please check your connection and try again.',
  }

  return messages[statusCode] ?? 'An unexpected error occurred. Please try again or contact support.'
}

export default getUserErrorMessageFromStatusCode
