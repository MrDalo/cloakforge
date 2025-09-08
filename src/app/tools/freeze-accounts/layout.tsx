import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Freeze Token Accounts | Solana Token Account Management - SolCloak',
  description:
    'Freeze specific Solana token accounts to prevent transfers and transactions. Essential tool for token security, compliance, and risk management on the Solana blockchain.',
  keywords:
    'freeze token accounts, Solana account freeze, token account management, Solana security tools, freeze transactions, token compliance, account control, solcloak',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Freeze Token Accounts | Solana Token Account Management - SolCloak',
    description:
      'Freeze specific Solana token accounts to prevent transfers and transactions. Essential tool for token security, compliance, and risk management.',
    url: 'https://solcloak.app/tools/freeze-accounts',
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
    title: 'Freeze Token Accounts | Solana Token Account Management - SolCloak',
    description:
      'Freeze specific Solana token accounts to prevent transfers and transactions. Essential tool for token security, compliance, and risk management.',
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
    title: 'Freeze Token Accounts | Solana Token Account Management - SolCloak',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
