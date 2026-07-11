import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Terms of Service | CloakForge',
  description:
    'Read the terms of service for CloakForge, the comprehensive Solana token creation and management platform. Understand your rights and responsibilities when using our services.',
  keywords: 'terms of service, legal terms, user agreement, CloakForge terms, Solana token platform terms, user rights, platform usage',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://cloakforge.app/terms-of-service',
  },
  openGraph: {
    title: 'Terms of Service | CloakForge',
    description:
      'Read the terms of service for CloakForge, the comprehensive Solana token creation and management platform. Understand your rights and responsibilities when using our services.',
    url: 'https://cloakforge.app/terms-of-service',
    type: 'website',
    siteName: 'CloakForge',
    images: [
      {
        url: 'https://cloakforge.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CloakForge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cloakforge',
    creator: '@cloakforge',
    title: 'Terms of Service | CloakForge',
    description:
      'Read the terms of service for CloakForge, the comprehensive Solana token creation and management platform. Understand your rights and responsibilities when using our services.',
    images: [
      {
        url: 'https://cloakforge.app/og-image.png',
        alt: 'CloakForge',
        width: 1200,
        height: 630,
      },
    ],
  },
  appleWebApp: {
    title: 'Terms of Service | CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
