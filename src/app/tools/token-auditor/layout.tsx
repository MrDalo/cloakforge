import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Solana Token Auditor | Free SPL Token Analysis Tool - SolCloak',
  description:
    'Audit and analyze Solana SPL tokens with our comprehensive free tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain.',
  keywords:
    'Solana token auditor, SPL token analysis, token security check, Solana token scanner, token metadata verification, token holder analysis, crypto audit tool, blockchain analysis, solcloak',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Solana Token Auditor | Free SPL Token Analysis Tool - SolCloak',
    description:
      'Audit and analyze Solana SPL tokens with our comprehensive free tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain.',
    url: 'https://solcloak.app/tools/token-auditor',
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
    title: 'Solana Token Auditor | Free SPL Token Analysis Tool - SolCloak',
    description:
      'Audit and analyze Solana SPL tokens with our comprehensive free tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain.',
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
    title: 'Solana Token Auditor | Free SPL Token Analysis Tool - SolCloak',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
