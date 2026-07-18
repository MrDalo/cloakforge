import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
    <ToolStructuredData
      description='Unfreeze specific Solana token wallets to allow transfers and transactions. Essential tool for token security, compliance, and risk management.'
      faqs={unfreezeWalletsFAQs}
      howToSteps={[
        { name: 'Connect Your Wallet', text: 'Connect the Solana wallet that holds freeze authority over the token.' },
        {
          name: 'Select Token and Target Wallet',
          text: 'Choose the token and the previously frozen wallet address you want to unfreeze.',
        },
        { name: 'Confirm the Unfreeze', text: 'Review the details before proceeding.' },
        { name: 'Sign the Transaction', text: 'Sign in your wallet to unfreeze the target token account, restoring transfers.' },
      ]}
      name='Unfreeze Wallets'
      path='/tools/unfreeze-wallets'
    />
    {children}
  </>
)

export default Layout
