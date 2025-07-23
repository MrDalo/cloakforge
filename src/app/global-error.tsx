'use client'

import { useEffect } from 'react'
import { ErrorPage } from '@/components/pages/ErrorPage'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

const GlobalError = ({ error, reset }: GlobalErrorProps): React.ReactNode => {
  useEffect(() => {
    // Log the error to an error reporting service
    // eslint-disable-next-line no-console
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang='en'>
      <body>
        <ErrorPage
          onReset={reset}
          subtitle='A critical error occurred in the application. Please try refreshing the page or contact our support team for assistance.'
          title='Critical System Error'
        />
      </body>
    </html>
  )
}

export default GlobalError
