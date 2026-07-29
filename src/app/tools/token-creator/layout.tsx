import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { tokenCreatorFAQs } from '@/components/pages/TokenCreatorPage/FAQSection/faqData'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Create Solana Token | SPL Token Creator Tool - CloakForge',
  description:
    'Create custom Solana SPL tokens instantly with our no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes for 0.19 SOL.',
  keywords:
    'create Solana token, SPL token creator, mint Solana token, token generator, Solana blockchain, custom token creator, no-code token creation, cloakforge',
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
    canonical: 'https://cloakforge.app/tools/token-creator',
  },
  openGraph: {
    title: 'Create Solana Token | SPL Token Creator Tool - CloakForge',
    description:
      'Create custom Solana SPL tokens instantly with our no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes for 0.19 SOL.',
    url: 'https://cloakforge.app/tools/token-creator',
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
    title: 'Create Solana Token | SPL Token Creator Tool - CloakForge',
    description:
      'Create custom Solana SPL tokens instantly with our no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes for 0.19 SOL.',
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
    title: 'Create Solana Token | SPL Token Creator Tool - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <>
    <ToolStructuredData
      description='Create custom Solana SPL tokens instantly with our no-code tool. Generate new tokens with custom names, symbols, decimals, and supply.'
      faqs={tokenCreatorFAQs}
      howToSteps={[
        { name: 'Connect Your Wallet', text: 'Connect a Solana wallet such as Phantom or Solflare to get started.' },
        {
          name: 'Enter Token Details',
          text: 'Provide the token name, symbol, decimals, and total supply, plus optional metadata like logo and social links.',
        },
        { name: 'Review the Fee', text: 'Check the platform fee and estimated network fee before proceeding.' },
        { name: 'Sign and Create', text: 'Sign the transaction in your wallet to mint the new SPL token on Solana.' },
      ]}
      name='Token Creator'
      path='/tools/token-creator'
    />
    {children}
  </>
)

export default Layout
