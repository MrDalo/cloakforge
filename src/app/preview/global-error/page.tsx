'use client'

import { ErrorPage } from '@/components/pages/ErrorPage'

const GlobalErrorPreview = (): React.ReactNode => (
  <ErrorPage
    subtitle='This is a preview of the global error page. A critical error occurred in the application. Please try refreshing the page or contact our support team for assistance.'
    title='Critical System Error'
  />
)

export default GlobalErrorPreview
