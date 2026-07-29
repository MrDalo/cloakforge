import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { revokeMintAuthorityFAQs } from '@/components/pages/RevokeMintAuthorityPage/FAQSection/faqData'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Revoke Mint Authority | Secure Solana Token Management - CloakForge',
  description:
    'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
  keywords:
    'revoke mint authority, Solana minting control, token mint authority, Solana token management, secure minting, revoke permissions, cloakforge',
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
    canonical: 'https://cloakforge.app/tools/revoke-mint-authority',
  },
  openGraph: {
    title: 'Revoke Mint Authority | Secure Solana Token Management - CloakForge',
    description:
      'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
    url: 'https://cloakforge.app/tools/revoke-mint-authority',
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
    title: 'Revoke Mint Authority | Secure Solana Token Management - CloakForge',
    description:
      'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
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
    title: 'Revoke Mint Authority | Secure Solana Token Management - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <>
    <ToolStructuredData
      description="Revoke mint authority for Solana tokens and enhance security. Control your token's minting permissions to protect against unauthorized minting."
      faqs={revokeMintAuthorityFAQs}
      howToSteps={[
        { name: 'Connect Your Wallet', text: 'Connect the Solana wallet that holds mint authority over the token.' },
        { name: 'Choose the Token', text: 'Select the token whose mint authority you want to revoke.' },
        { name: 'Confirm the Revocation', text: 'Review that this action is permanent and cannot be undone.' },
        { name: 'Sign the Transaction', text: 'Sign in your wallet to permanently revoke mint authority on-chain.' },
      ]}
      name='Revoke Mint Authority'
      path='/tools/revoke-mint-authority'
    />
    {children}
  </>
)

export default Layout
