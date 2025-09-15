import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Solana Token Auditor | Free SPL Token Analysis Tool - CloakForge',
  description:
    'Audit and analyze Solana SPL tokens with our comprehensive free tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain.',
  keywords:
    'Solana token auditor, SPL token analysis, token security check, Solana token scanner, token metadata verification, token holder analysis, crypto audit tool, blockchain analysis, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Solana Token Auditor | Free SPL Token Analysis Tool - CloakForge',
    description:
      'Audit and analyze Solana SPL tokens with our comprehensive free tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain.',
    url: 'https://cloakforge.app/tools/token-auditor',
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
    title: 'Solana Token Auditor | Free SPL Token Analysis Tool - CloakForge',
    description:
      'Audit and analyze Solana SPL tokens with our comprehensive free tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain.',
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
    title: 'Solana Token Auditor | Free SPL Token Analysis Tool - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
