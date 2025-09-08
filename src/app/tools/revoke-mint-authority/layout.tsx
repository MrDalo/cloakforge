import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Revoke Mint Authority | Secure Solana Token Management - SolCloak',
  description:
    'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
  keywords:
    'revoke mint authority, Solana minting control, token mint authority, Solana token management, secure minting, revoke permissions, solcloak',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Revoke Mint Authority | Secure Solana Token Management - SolCloak',
    description:
      'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
    url: 'https://solcloak.app/tools/revoke-mint-authority',
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
    title: 'Revoke Mint Authority | Secure Solana Token Management - SolCloak',
    description:
      'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
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
    title: 'Revoke Mint Authority | Secure Solana Token Management - SolCloak',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
