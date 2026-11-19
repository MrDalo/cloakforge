import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { faqData as tokenAuditorFAQs } from '@/components/pages/TokenAuditorPage/tokenAuditorData'
import { applyLivePricing } from '@/lib/config/livePricing'
import { getToolConfigurationsWithFallback } from '@/lib/contentful/toolConfigCache'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Solana Token Auditor | SPL Token Analysis Tool - CloakForge',
  description:
    'Audit and analyze Solana SPL tokens with our comprehensive tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain. Completely free to use.',
  keywords:
    'Solana token auditor, SPL token analysis, token security check, Solana token scanner, token metadata verification, token holder analysis, crypto audit tool, blockchain analysis, cloakforge',
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
    canonical: 'https://cloakforge.app/tools/token-auditor',
  },
  openGraph: {
    title: 'Solana Token Auditor | SPL Token Analysis Tool - CloakForge',
    description:
      'Audit and analyze Solana SPL tokens with our comprehensive tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain. Completely free to use.',
    url: 'https://cloakforge.app/tools/token-auditor',
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
    title: 'Solana Token Auditor | SPL Token Analysis Tool - CloakForge',
    description:
      'Audit and analyze Solana SPL tokens with our comprehensive tool. Check token security, verify metadata, analyze holders, and get detailed token insights on Solana blockchain. Completely free to use.',
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
    title: 'Solana Token Auditor | SPL Token Analysis Tool - CloakForge',
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
        description='Audit and analyze Solana SPL tokens with our comprehensive tool. Check token security, verify metadata, analyze holders, and get detailed token insights. Completely free to use.'
        faqs={applyLivePricing(tokenAuditorFAQs, toolConfigs)}
        howToSteps={[
          { name: 'Enter a Token Address', text: 'Paste the Solana token mint address you want to audit.' },
          { name: 'Run the Audit', text: "CloakForge analyzes the token's metadata, authorities, and holder distribution." },
          {
            name: 'Review the Security Report',
            text: 'See flagged risks such as active mint authority, freeze authority, or liquidity concerns, free of charge.',
          },
        ]}
        name='Token Auditor'
        path='/tools/token-auditor'
      />
      {children}
    </>
  )
}

export default Layout
