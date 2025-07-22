import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Create Solana Token | Free SPL Token Creator Tool - CryptoForge',
  description:
    'Create custom Solana SPL tokens instantly with our free no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes.',
  keywords:
    'create Solana token, SPL token creator, mint Solana token, token generator, Solana blockchain, custom token creator, free token maker, no-code token creation, cryptoforge',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Create Solana Token | Free SPL Token Creator Tool - CryptoForge',
    description:
      'Create custom Solana SPL tokens instantly with our free no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes.',
    url: 'https://cryptoforge.app/tools/token-creator',
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
    title: 'Create Solana Token | Free SPL Token Creator Tool - CryptoForge',
    description:
      'Create custom Solana SPL tokens instantly with our free no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes.',
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
    title: 'Create Solana Token | Free SPL Token Creator Tool - CryptoForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
