import { type Metadata } from 'next'
import React from 'react'
import { FaqJsonLd } from '@/components/common'
import { faqs as multisenderFAQs } from '@/components/pages/TransactionMultisenderPage/multisenderData'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Solana Multisender | Batch Send Solana Tokens - CloakForge',
  description:
    'Send Solana SPL tokens and SOL to multiple recipients in one transaction. Bulk token distribution tool saves time and transaction fees. Perfect for airdrops and mass payments.',
  keywords:
    'Solana multisender, batch send tokens, bulk token transfer, Solana airdrop tool, mass payment, SPL token distribution, bulk transaction, send to multiple wallets, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://cloakforge.app/tools/transaction-multisender',
  },
  openGraph: {
    title: 'Solana Multisender | Batch Send Solana Tokens - CloakForge',
    description:
      'Send Solana tokens to multiple recipients at once with the Solana multisender tool. Save time and network fees by batch sending transactions on the Solana blockchain.',
    url: 'https://cloakforge.app/tools/transaction-multisender',
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
    title: 'Solana Multisender | Batch Send Solana Tokens - CloakForge',
    description:
      'Send Solana tokens to multiple recipients at once with the Solana multisender tool. Save time and network fees by batch sending transactions on the Solana blockchain.',
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
    title: 'Solana Multisender | Batch Send Solana Tokens - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <>
    <FaqJsonLd faqs={multisenderFAQs} />
    {children}
  </>
)

export default Layout
