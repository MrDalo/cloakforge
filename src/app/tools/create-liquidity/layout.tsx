import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - CryptoForge',
  description:
    'Build Solana liquidity pools with ease using our intuitive tool. Provide liquidity to decentralized exchanges and earn rewards. Securely manage Solana assets in liquidity pools.',
  keywords:
    'Solana liquidity, create liquidity pool, Solana liquidity creation, DEX liquidity, blockchain liquidity pool, Solana DeFi tools, cryptoforge',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - CryptoForge',
    description:
      'Build Solana liquidity pools with ease using our intuitive tool. Provide liquidity to decentralized exchanges and earn rewards. Securely manage Solana assets in liquidity pools.',
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
    title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - CryptoForge',
    description:
      'Build Solana liquidity pools with ease using our intuitive tool. Provide liquidity to decentralized exchanges and earn rewards. Securely manage Solana assets in liquidity pools.',
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
    title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - CryptoForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
