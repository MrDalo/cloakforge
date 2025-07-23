'use client'

import { ErrorPage } from '@/components/pages/ErrorPage'

const ErrorPreview = (): React.ReactNode => (
  <div>
    {/* Regular Error Preview */}
    <ErrorPage
      subtitle='This is a preview of the error page. You can test the Try Again, Back to Home, and Go Back buttons.'
      title='Error Page Preview'
    />
  </div>
)

export default ErrorPreview
