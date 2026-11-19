import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { updateMetadataFAQs } from '@/components/pages/UpdateMetadataPage/FAQSection/faqData'
import { applyLivePricing } from '@/lib/config/livePricing'
import { getToolConfigurationsWithFallback } from '@/lib/contentful/toolConfigCache'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Update Token Metadata | Solana Token-2022 Metadata Editor - CloakForge',
  description:
    'Update your Solana Token-2022 name, symbol, logo, and social links directly from your wallet. Fast, low-cost, authority-gated metadata updates with automatic IPFS uploads.',
  keywords:
    'update Solana token metadata, Token-2022 metadata editor, change token name, change token symbol, update token logo, Solana metadata pointer, cloakforge',
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
    canonical: 'https://cloakforge.app/tools/update-metadata',
  },
  openGraph: {
    title: 'Update Token Metadata | Solana Token-2022 Metadata Editor - CloakForge',
    description:
      'Update your Solana Token-2022 name, symbol, logo, and social links directly from your wallet. Fast, low-cost, authority-gated metadata updates with automatic IPFS uploads.',
    url: 'https://cloakforge.app/tools/update-metadata',
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
    title: 'Update Token Metadata | Solana Token-2022 Metadata Editor - CloakForge',
    description:
      'Update your Solana Token-2022 name, symbol, logo, and social links directly from your wallet. Fast, low-cost, authority-gated metadata updates with automatic IPFS uploads.',
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
    title: 'Update Token Metadata | Solana Token-2022 Metadata Editor - CloakForge',
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
        description='Update your Solana Token-2022 name, symbol, logo, and social links directly from your wallet as the metadata update authority.'
        faqs={applyLivePricing(updateMetadataFAQs, toolConfigs)}
        howToSteps={[
          { name: 'Connect Your Wallet', text: 'Connect a Solana wallet such as Phantom or Solflare to get started.' },
          { name: 'Select Your Token', text: 'Enter or choose the Token-2022 mint whose metadata you want to update.' },
          { name: 'Edit the Details', text: 'Update the pre-filled name, symbol, description, logo, and social links as needed.' },
          { name: 'Review the Fee', text: 'Check the platform fee and estimated network fee before proceeding.' },
          { name: 'Sign and Update', text: 'Sign the transaction in your wallet to write the updated metadata on-chain.' },
        ]}
        name='Update Token Metadata'
        path='/tools/update-metadata'
      />
      {children}
    </>
  )
}

export default Layout
