import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { revokeFreezeAuthorityFAQs } from '@/components/pages/RevokeFreezeAuthorityPage/FAQSection/faqData'
import { applyLivePricing } from '@/lib/config/livePricing'
import { getToolConfigurationsWithFallback } from '@/lib/contentful/toolConfigCache'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Revoke Freeze Authority | Solana Token Security Management - CloakForge',
  description:
    'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
  keywords:
    'revoke freeze authority, Solana token security, token freeze authority, Solana token management, secure tokens, revoke permissions, cloakforge',
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
    canonical: 'https://cloakforge.app/tools/revoke-freeze-authority',
  },
  openGraph: {
    title: 'Revoke Freeze Authority | Solana Token Security Management - CloakForge',
    description:
      'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
    url: 'https://cloakforge.app/tools/revoke-freeze-authority',
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
    title: 'Revoke Freeze Authority | Solana Token Security Management - CloakForge',
    description:
      'Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts with this essential security tool.',
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
    title: 'Revoke Freeze Authority | Solana Token Security Management - CloakForge',
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
        description='Revoke freeze authority for Solana tokens to enhance security and decentralization. Remove the ability to freeze token accounts.'
        faqs={applyLivePricing(revokeFreezeAuthorityFAQs, toolConfigs)}
        howToSteps={[
          { name: 'Connect Your Wallet', text: 'Connect the Solana wallet that holds freeze authority over the token.' },
          { name: 'Choose the Token', text: 'Select the token whose freeze authority you want to revoke.' },
          { name: 'Confirm the Revocation', text: 'Review that this action is permanent and cannot be undone.' },
          { name: 'Sign the Transaction', text: 'Sign in your wallet to permanently revoke freeze authority on-chain.' },
        ]}
        name='Revoke Freeze Authority'
        path='/tools/revoke-freeze-authority'
      />
      {children}
    </>
  )
}

export default Layout
