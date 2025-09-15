import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Unfreeze Token Accounts | Solana Token Account Management - CloakForge',
  description:
    'Unfreeze specific Solana token accounts to allow transfers and transactions. Essential tool for token security, compliance, and risk management on the Solana blockchain.',
  keywords:
    'unfreeze token accounts, Solana account unfreeze, token account management, Solana security tools, unfreeze transactions, token compliance, account control, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Unfreeze Token Accounts | Solana Token Account Management - CloakForge',
    description:
      'Unfreeze specific Solana token accounts to allow transfers and transactions. Essential tool for token security, compliance, and risk management.',
    url: 'https://cloakforge.app/tools/unfreeze-accounts',
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
    title: 'Unfreeze Token Accounts | Solana Token Account Management - CloakForge',
    description:
      'Unfreeze specific Solana token accounts to allow transfers and transactions. Essential tool for token security, compliance, and risk management.',
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
    title: 'Unfreeze Token Accounts | Solana Token Account Management - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
