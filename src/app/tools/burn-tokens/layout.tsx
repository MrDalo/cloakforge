import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { burnTokensFAQs } from '@/components/pages/BurnTokensPage/FAQSection/faqData'
import { applyLivePricing } from '@/lib/config/livePricing'
import { getToolConfigurationsWithFallback } from '@/lib/contentful/toolConfigCache'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Burn Solana Tokens | Reduce Token Supply Tool - CloakForge',
  description: `Permanently burn Solana SPL tokens to reduce circulating supply and manage tokenomics. Secure token burning tool for Solana blockchain. Destroy tokens irreversibly.`,
  keywords:
    'burn Solana tokens, reduce token supply, SPL token burning, Solana tokenomics, token destruction, deflationary tokens, burn mechanism, cloakforge',
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
        description='Permanently burn Solana SPL tokens to reduce circulating supply and manage tokenomics. Secure token burning tool for Solana blockchain.'
        faqs={applyLivePricing(burnTokensFAQs, toolConfigs)}
        howToSteps={[
          { name: 'Connect Your Wallet', text: 'Connect a Solana wallet holding the token you want to burn.' },
          { name: 'Choose a Token and Amount', text: 'Select the token from your wallet and enter the amount to permanently destroy.' },
          { name: 'Review the Fee', text: 'Check the platform and network fee before proceeding.' },
          { name: 'Sign and Burn', text: 'Sign the transaction in your wallet to permanently burn the tokens and reduce supply.' },
        ]}
        name='Burn Tokens'
        path='/tools/burn-tokens'
      />
      {children}
    </>
  )
}

export default Layout
