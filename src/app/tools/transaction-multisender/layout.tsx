import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { faqs as multisenderFAQs } from '@/components/pages/TransactionMultisenderPage/multisenderData'
import { applyLivePricing } from '@/lib/config/livePricing'
import { getToolConfigurationsWithFallback } from '@/lib/contentful/toolConfigCache'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Solana Multisender | Batch Send Solana Tokens - CloakForge',
  description:
    'Send Solana SPL tokens and SOL to multiple recipients in one transaction. Bulk token distribution tool saves time and transaction fees. Perfect for airdrops and mass payments.',
  keywords:
    'Solana multisender, batch send tokens, bulk token transfer, Solana airdrop tool, mass payment, SPL token distribution, bulk transaction, send to multiple wallets, cloakforge',
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

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): Promise<React.ReactNode> => {
  // Live Contentful prices, cached prices during an outage, or the fallback fees
  const toolConfigs = await getToolConfigurationsWithFallback()

  return (
    <>
      <ToolStructuredData
        description='Send Solana SPL tokens and SOL to multiple recipients in one transaction. Bulk token distribution tool saves time and transaction fees.'
        faqs={applyLivePricing(multisenderFAQs, toolConfigs)}
        howToSteps={[
          { name: 'Connect Your Wallet', text: 'Connect a Solana wallet holding the token or SOL you want to distribute.' },
          {
            name: 'Select Token and Add Recipients',
            text: 'Choose the token to send and add recipient wallet addresses with amounts, individually or via CSV.',
          },
          { name: 'Review the Batch', text: 'Review the full recipient list and total fees before sending.' },
          { name: 'Sign and Send', text: 'Sign a single transaction in your wallet to send tokens to all recipients at once.' },
        ]}
        name='Transaction Multisender'
        path='/tools/transaction-multisender'
      />
      {children}
    </>
  )
}

export default Layout
