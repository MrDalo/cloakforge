import { type Metadata } from 'next'
import React from 'react'
import { FaqJsonLd } from '@/components/common'
import { faqs as unfreezeWalletsFAQs } from '@/components/pages/UnfreezeWalletsPage/unfreezeWalletsData'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Unfreeze Token Wallets | Solana Token Wallet Management - CloakForge',
  description:
    'Unfreeze specific Solana token wallets to allow transfers and transactions. Essential tool for token security, compliance, and risk management on the Solana blockchain.',
  keywords:
    'unfreeze token wallets, Solana wallet unfreeze, token wallet management, Solana security tools, unfreeze transactions, token compliance, wallet control, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://cloakforge.app/tools/unfreeze-wallets',
  },
  openGraph: {
    title: 'Unfreeze Token Wallets | Solana Token Wallet Management - CloakForge',
    description:
      'Unfreeze specific Solana token wallets to allow transfers and transactions. Essential tool for token security, compliance, and risk management.',
    url: 'https://cloakforge.app/tools/unfreeze-wallets',
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
    title: 'Unfreeze Token Wallets | Solana Token Wallet Management - CloakForge',
    description:
      'Unfreeze specific Solana token wallets to allow transfers and transactions. Essential tool for token security, compliance, and risk management.',
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
    title: 'Unfreeze Token Wallets | Solana Token Wallet Management - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <>
    <FaqJsonLd faqs={unfreezeWalletsFAQs} />
    {children}
  </>
)

export default Layout
