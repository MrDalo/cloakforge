import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { revokeMetadataAuthorityFAQs } from '@/components/pages/RevokeMetadataAuthorityPage/FAQSection/faqData'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Revoke Metadata Authority | Secure Solana Token Management - CloakForge',
  description:
    "Revoke the on-chain metadata update authority for Solana Token-2022 tokens and make your token's name, symbol, and image permanently immutable. Build trust and prevent metadata rug pulls.",
  keywords:
    'revoke metadata authority, Solana metadata immutable, token metadata update authority, Token-2022 metadata, secure token metadata, revoke permissions, cloakforge',
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
    canonical: 'https://cloakforge.app/tools/revoke-metadata-authority',
  },
  openGraph: {
    title: 'Revoke Metadata Authority | Secure Solana Token Management - CloakForge',
    description:
      "Revoke the on-chain metadata update authority for Solana Token-2022 tokens and make your token's name, symbol, and image permanently immutable. Build trust and prevent metadata rug pulls.",
    url: 'https://cloakforge.app/tools/revoke-metadata-authority',
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
    title: 'Revoke Metadata Authority | Secure Solana Token Management - CloakForge',
    description:
      "Revoke the on-chain metadata update authority for Solana Token-2022 tokens and make your token's name, symbol, and image permanently immutable. Build trust and prevent metadata rug pulls.",
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
    title: 'Revoke Metadata Authority | Secure Solana Token Management - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <>
    <ToolStructuredData
      description='Revoke the metadata update authority for Solana Token-2022 tokens so the name, symbol, and image URI can never be changed again.'
      faqs={revokeMetadataAuthorityFAQs}
      howToSteps={[
        { name: 'Connect Your Wallet', text: 'Connect the Solana wallet that holds the metadata update authority over the token.' },
        { name: 'Choose the Token', text: 'Select the Token-2022 token whose metadata authority you want to revoke.' },
        { name: 'Confirm the Revocation', text: 'Review that this action is permanent and cannot be undone.' },
        { name: 'Sign the Transaction', text: 'Sign in your wallet to permanently revoke metadata authority on-chain.' },
      ]}
      name='Revoke Metadata Authority'
      path='/tools/revoke-metadata-authority'
    />
    {children}
  </>
)

export default Layout
