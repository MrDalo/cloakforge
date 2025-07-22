import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Revoke Freeze Authority | Solana Token Security Management - CryptoForge',
  description:
    'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
  keywords:
    'revoke freeze authority, Solana token security, token freeze authority, Solana token management, secure tokens, revoke permissions, cryptoforge',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Revoke Freeze Authority | Solana Token Security Management - CryptoForge',
    description:
      'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
    url: 'https://cryptoforge.app/tools/revoke-freeze-authority',
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
    title: 'Revoke Freeze Authority | Solana Token Security Management - CryptoForge',
    description:
      'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
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
    title: 'Revoke Freeze Authority | Solana Token Security Management - CryptoForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
