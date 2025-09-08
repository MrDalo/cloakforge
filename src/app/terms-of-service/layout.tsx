import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Terms of Service | SolCloak',
  description:
    'Read the terms of service for SolCloak, the comprehensive Solana token creation and management platform. Understand your rights and responsibilities when using our services.',
  keywords: 'terms of service, legal terms, user agreement, SolCloak terms, Solana token platform terms, user rights, platform usage',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Terms of Service | SolCloak',
    description:
      'Read the terms of service for SolCloak, the comprehensive Solana token creation and management platform. Understand your rights and responsibilities when using our services.',
    url: 'https://solcloak.app/terms-of-service',
    type: 'website',
    siteName: 'SolCloak',
    images: [
      {
        url: 'https://solcloak.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SolCloak',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@solcloak',
    creator: '@solcloak',
    title: 'Terms of Service | SolCloak',
    description:
      'Read the terms of service for SolCloak, the comprehensive Solana token creation and management platform. Understand your rights and responsibilities when using our services.',
    images: [
      {
        url: 'https://solcloak.app/og-image.png',
        alt: 'SolCloak',
        width: 1200,
        height: 630,
      },
    ],
  },
  appleWebApp: {
    title: 'Terms of Service | SolCloak',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
