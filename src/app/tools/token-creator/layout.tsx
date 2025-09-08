import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Create Solana Token | Free SPL Token Creator Tool - SolCloak',
  description:
    'Create custom Solana SPL tokens instantly with our free no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes.',
  keywords:
    'create Solana token, SPL token creator, mint Solana token, token generator, Solana blockchain, custom token creator, free token maker, no-code token creation, solcloak',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Create Solana Token | Free SPL Token Creator Tool - SolCloak',
    description:
      'Create custom Solana SPL tokens instantly with our free no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes.',
    url: 'https://solcloak.app/tools/token-creator',
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
    title: 'Create Solana Token | Free SPL Token Creator Tool - SolCloak',
    description:
      'Create custom Solana SPL tokens instantly with our free no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes.',
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
    title: 'Create Solana Token | Free SPL Token Creator Tool - SolCloak',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
