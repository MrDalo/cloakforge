import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Revoke Mint Authority | Secure Solana Token Management - CloakForge',
  description:
    'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
  keywords:
    'revoke mint authority, Solana minting control, token mint authority, Solana token management, secure minting, revoke permissions, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Revoke Mint Authority | Secure Solana Token Management - CloakForge',
    description:
      'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
    url: 'https://cloakforge.app/tools/revoke-mint-authority',
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
    title: 'Revoke Mint Authority | Secure Solana Token Management - CloakForge',
    description:
      'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
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
    title: 'Revoke Mint Authority | Secure Solana Token Management - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
