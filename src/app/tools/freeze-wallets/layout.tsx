import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Freeze Token Wallets | Solana Token Wallet Management - CloakForge',
  description:
    'Freeze specific Solana token wallets to prevent transfers and transactions. Essential tool for token security, compliance, and risk management on the Solana blockchain.',
  keywords:
    'freeze token wallets, Solana wallet freeze, token wallet management, Solana security tools, freeze transactions, token compliance, wallet control, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Freeze Token Wallets | Solana Token Wallet Management - CloakForge',
    description:
      'Freeze specific Solana token wallets to prevent transfers and transactions. Essential tool for token security, compliance, and risk management.',
    url: 'https://cloakforge.app/tools/freeze-wallets',
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
    title: 'Freeze Token Wallets | Solana Token Wallet Management - CloakForge',
    description:
      'Freeze specific Solana token wallets to prevent transfers and transactions. Essential tool for token security, compliance, and risk management.',
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
    title: 'Freeze Token Wallets | Solana Token Wallet Management - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
