import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Terms of Service | CryptoForge',
  description:
    'Read the terms of service for CryptoForge, the comprehensive Solana token creation and management platform. Understand your rights and responsibilities when using our services.',
  keywords: 'terms of service, legal terms, user agreement, CryptoForge terms, Solana token platform terms, user rights, platform usage',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Terms of Service | CryptoForge',
    description:
      'Read the terms of service for CryptoForge, the comprehensive Solana token creation and management platform. Understand your rights and responsibilities when using our services.',
    url: 'https://cryptoforge.app/terms-of-service',
    type: 'website',
    siteName: 'CryptoForge',
    images: [
      {
        url: 'https://cryptoforge.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CryptoForge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cryptoforge',
    creator: '@cryptoforge',
    title: 'Terms of Service | CryptoForge',
    description:
      'Read the terms of service for CryptoForge, the comprehensive Solana token creation and management platform. Understand your rights and responsibilities when using our services.',
    images: [
      {
        url: 'https://cryptoforge.app/og-image.png',
        alt: 'CryptoForge',
        width: 1200,
        height: 630,
      },
    ],
  },
  appleWebApp: {
    title: 'Terms of Service | CryptoForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
