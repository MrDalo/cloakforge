import { type Metadata } from 'next'
import React from 'react'
import { FaqJsonLd } from '@/components/common'
import { burnTokensFAQs } from '@/components/pages/BurnTokensPage/FAQSection/faqData'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Burn Solana Tokens | Reduce Token Supply Tool - CloakForge',
  description: `Permanently burn Solana SPL tokens to reduce circulating supply and manage tokenomics. Secure token burning tool for Solana blockchain. Destroy tokens irreversibly.`,
  keywords:
    'burn Solana tokens, reduce token supply, SPL token burning, Solana tokenomics, token destruction, deflationary tokens, burn mechanism, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://cloakforge.app/tools/burn-tokens',
  },
  openGraph: {
    title: 'Burn Solana Tokens | Token Burning Tool - CloakForge',
    description: `Burn Solana tokens to reduce supply or manage tokenomics. Our simple tool lets you destroy tokens securely on the Solana blockchain. Take control of your token's economy.`,
    url: 'https://cloakforge.app/tools/burn-tokens',
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
    title: 'Burn Solana Tokens | Token Burning Tool - CloakForge',
    description: `Burn Solana tokens to reduce supply or manage tokenomics. Our simple tool lets you destroy tokens securely on the Solana blockchain. Take control of your token's economy.`,
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
    title: 'Burn Solana Tokens | Token Burning Tool - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <>
    <FaqJsonLd faqs={burnTokensFAQs} />
    {children}
  </>
)

export default Layout
