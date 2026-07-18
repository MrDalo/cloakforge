import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { faqs as freezeWalletsFAQs } from '@/components/pages/FreezeWalletsPage/freezeWalletsData'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Freeze Token Wallets | Solana Token Wallet Management - CloakForge',
  description:
    'Freeze specific Solana token wallets to prevent transfers and transactions. Essential tool for token security, compliance, and risk management on the Solana blockchain.',
  keywords:
    'freeze token wallets, Solana wallet freeze, token wallet management, Solana security tools, freeze transactions, token compliance, wallet control, cloakforge',
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
    canonical: 'https://cloakforge.app/tools/freeze-wallets',
  },
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
}>): React.ReactNode => (
  <>
    <ToolStructuredData
      description='Freeze specific Solana token wallets to prevent transfers and transactions. Essential tool for token security, compliance, and risk management.'
      faqs={freezeWalletsFAQs}
      howToSteps={[
        { name: 'Connect Your Wallet', text: 'Connect the Solana wallet that holds freeze authority over the token.' },
        {
          name: 'Select Token and Target Wallet',
          text: 'Choose the token and the wallet address whose token account you want to freeze.',
        },
        { name: 'Confirm the Freeze', text: 'Review the details before proceeding.' },
        { name: 'Sign the Transaction', text: 'Sign in your wallet to freeze the target token account, blocking transfers.' },
      ]}
      name='Freeze Wallets'
      path='/tools/freeze-wallets'
    />
    {children}
  </>
)

export default Layout
