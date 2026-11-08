import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Debug-only segment: the /test page builds real SOL transfers, so it must never be
 * reachable outside `npm run dev`. Every other environment (Vercel preview, production,
 * local `next start`) gets a 404.
 */
const TestLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return <>{children}</>
}

export default TestLayout
