import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Revoke Freeze Authority | Solana Token Security Management - CloakForge',
  description:
    'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
  keywords:
    'revoke freeze authority, Solana token security, token freeze authority, Solana token management, secure tokens, revoke permissions, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Revoke Freeze Authority | Solana Token Security Management - CloakForge',
    description:
      'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
    url: 'https://cloakforge.app/tools/revoke-freeze-authority',
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
    title: 'Revoke Freeze Authority | Solana Token Security Management - CloakForge',
    description:
      'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
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
    title: 'Revoke Freeze Authority | Solana Token Security Management - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
