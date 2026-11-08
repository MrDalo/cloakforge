import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Debug-only segment: /preview/* hosts error-page and toast playgrounds that are only
 * useful during local development. Every other environment gets a 404.
 */
const PreviewLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return <>{children}</>
}

export default PreviewLayout
