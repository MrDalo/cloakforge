'use client'

import { useEffect } from 'react'
import { ErrorPage } from '@/components/pages/ErrorPage'
import { getLogger } from '@/lib/logger/logger'

interface ErrorProps {
  error: Error & { digest?: string; status?: number; statusText?: string }
  reset: () => void
}

const Error = ({ error, reset }: ErrorProps): React.ReactNode => {
  // Check if we're in development mode first
  const isDevelopment = process.env.NODE_ENV === 'development'

  useEffect(() => {
    // Log the error to an error reporting service
    // In production, sanitize the error before logging
    const sanitizedError = {
      message: error.message,
      name: error.name,
      stack: isDevelopment ? error.stack : undefined, // Only include stack in development
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    const logger = getLogger({ context: 'error-boundary', page: 'application' })
    logger.error('Application error:', sanitizedError)

    // In production, send to error monitoring service (e.g., Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   errorReportingService.captureException(sanitizedError)
    // }
  }, [error, isDevelopment])

  // Extract error details (only show detailed info in development)

  const errorDetails = isDevelopment
    ? {
        message: error.message || 'Unknown error occurred',
        status: error.status,
        statusText: error.statusText,
        digest: error.digest,
        name: error.name || 'Error',
      }
    : undefined

  // Create a more detailed subtitle based on error information
  const getErrorSubtitle = (): string => {
    // In production, use generic messages
    if (!isDevelopment) {
      return 'We encountered an unexpected error while processing your request. Please try again or contact support if the problem persists.'
    }

    // In development, show more specific information
    let subtitle = 'We encountered an unexpected error while processing your request.'

    if (errorDetails?.status) {
      subtitle = `HTTP ${errorDetails.status} Error: ${errorDetails.statusText || 'Request failed'}.`
    } else if (errorDetails?.name === 'ChunkLoadError') {
      subtitle = 'Failed to load application resources. This might be due to a network issue or outdated cache.'
    } else if (errorDetails?.name === 'TypeError') {
      subtitle = 'A technical error occurred while processing your request.'
    }

    return `${subtitle} Please try again or contact support if the problem persists.`
  }

  const getErrorTitle = (): string => {
    // In production, use generic title
    if (!isDevelopment) {
      return 'Something Went Wrong'
    }

    // In development, show status code if available
    if (errorDetails?.status) {
      return `Error ${errorDetails.status}`
    }
    return 'Something Went Wrong'
  }

  return <ErrorPage errorDetails={errorDetails} onReset={reset} subtitle={getErrorSubtitle()} title={getErrorTitle()} />
}

export default Error
