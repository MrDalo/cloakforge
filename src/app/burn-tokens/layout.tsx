import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Burn Solana Tokens | Token Burning Tool - CryptoForge',
  description: `Burn Solana tokens to reduce supply or manage tokenomics. Our simple tool lets you destroy tokens securely on the Solana blockchain. Take control of your token's economy.`,
  keywords:
    'burn Solana tokens, token burning, Solana tokenomics, reduce token supply, Solana blockchain burning, token destruction, cryptoforge',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Burn Solana Tokens | Token Burning Tool - CryptoForge',
    description: `Burn Solana tokens to reduce supply or manage tokenomics. Our simple tool lets you destroy tokens securely on the Solana blockchain. Take control of your token's economy.`,
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
    title: 'Burn Solana Tokens | Token Burning Tool - CryptoForge',
    description: `Burn Solana tokens to reduce supply or manage tokenomics. Our simple tool lets you destroy tokens securely on the Solana blockchain. Take control of your token's economy.`,
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
    title: 'Burn Solana Tokens | Token Burning Tool - CryptoForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
