import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Revoke Freeze Authority | Solana Token Security Management - SolCloak',
  description:
    'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
  keywords:
    'revoke freeze authority, Solana token security, token freeze authority, Solana token management, secure tokens, revoke permissions, solcloak',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Revoke Freeze Authority | Solana Token Security Management - SolCloak',
    description:
      'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
    url: 'https://solcloak.app/tools/revoke-freeze-authority',
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
    title: 'Revoke Freeze Authority | Solana Token Security Management - SolCloak',
    description:
      'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
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
    title: 'Revoke Freeze Authority | Solana Token Security Management - SolCloak',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
