import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Solana Token Auditor | Free SPL Token Analysis Tool - CryptoForge',
  description:
    'Audit and analyze Solana SPL tokens with our comprehensive free tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain.',
  keywords:
    'Solana token auditor, SPL token analysis, token security check, Solana token scanner, token metadata verification, token holder analysis, crypto audit tool, blockchain analysis, cryptoforge',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Solana Token Auditor | Free SPL Token Analysis Tool - CryptoForge',
    description:
      'Audit and analyze Solana SPL tokens with our comprehensive free tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain.',
    url: 'https://cryptoforge.app/tools/token-auditor',
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
    title: 'Solana Token Auditor | Free SPL Token Analysis Tool - CryptoForge',
    description:
      'Audit and analyze Solana SPL tokens with our comprehensive free tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain.',
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
    title: 'Solana Token Auditor | Free SPL Token Analysis Tool - CryptoForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
