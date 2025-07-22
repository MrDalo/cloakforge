import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Solana Multisender | Batch Send SPL Tokens to Multiple Wallets - CryptoForge',
  description:
    'Send Solana SPL tokens and SOL to multiple recipients in one transaction. Bulk token distribution tool saves time and transaction fees. Perfect for airdrops and mass payments.',
  keywords:
    'Solana multisender, batch send tokens, bulk token transfer, Solana airdrop tool, mass payment, SPL token distribution, bulk transaction, send to multiple wallets, cryptoforge',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Solana Multisender | Batch Send Solana Tokens - CryptoForge',
    description:
      'Send Solana tokens to multiple recipients at once with the Solana multisender tool. Save time and gas fees by batch sending transactions on the Solana blockchain.',
    url: 'https://cryptoforge.app/tools/transaction-multisender',
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
    title: 'Solana Multisender | Batch Send Solana Tokens - CryptoForge',
    description:
      'Send Solana tokens to multiple recipients at once with the Solana multisender tool. Save time and gas fees by batch sending transactions on the Solana blockchain.',
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
    title: 'Solana Multisender | Batch Send Solana Tokens',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
