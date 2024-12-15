import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Solana Token Creator | Mint Your Own Solana Tokens - CryptoForge',
  description:
    'Easily create custom Solana tokens with our Token Creator tool. No coding required. Generate new Solana tokens for your project or personal use quickly and securely.',
  keywords:
    'Solana token creation, create Solana token, mint Solana token, token minter, Solana blockchain, token generator, blockchain token, crypto token creator, Solana token creator tool, cryptoforge',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Solana Token Creator | Mint Your Own Solana Tokens - CryptoForge',
    description:
      'Easily create custom Solana tokens with our Token Creator tool. No coding required. Generate new Solana tokens for your project or personal use quickly and securely.',
    url: 'https://cryptoforge.app/transaction-multisender',
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
    title: 'Solana Token Creator | Mint Your Own Solana Tokens - CryptoForge',
    description:
      'Easily create custom Solana tokens with our Token Creator tool. No coding required. Generate new Solana tokens for your project or personal use quickly and securely.',
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
    title: 'Solana Token Creator | Mint Your Own Solana Tokens - CryptoForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
