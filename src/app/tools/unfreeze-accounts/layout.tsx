import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Unfreeze Token Accounts | Solana Token Account Management - CryptoForge',
  description:
    'Unfreeze specific Solana token accounts to allow transfers and transactions. Essential tool for token security, compliance, and risk management on the Solana blockchain.',
  keywords:
    'unfreeze token accounts, Solana account unfreeze, token account management, Solana security tools, unfreeze transactions, token compliance, account control, cryptoforge',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Unfreeze Token Accounts | Solana Token Account Management - CryptoForge',
    description:
      'Unfreeze specific Solana token accounts to allow transfers and transactions. Essential tool for token security, compliance, and risk management.',
    url: 'https://cryptoforge.app/tools/unfreeze-accounts',
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
    title: 'Unfreeze Token Accounts | Solana Token Account Management - CryptoForge',
    description:
      'Unfreeze specific Solana token accounts to allow transfers and transactions. Essential tool for token security, compliance, and risk management.',
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
    title: 'Unfreeze Token Accounts | Solana Token Account Management - CryptoForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
