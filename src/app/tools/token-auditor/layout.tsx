import { type Metadata } from 'next'
import React from 'react'
import { ToolStructuredData } from '@/components/common'
import { faqData as tokenAuditorFAQs } from '@/components/pages/TokenAuditorPage/tokenAuditorData'

const TOKEN_AUDITOR_DESCRIPTION =
  'Free, automated checks of a Solana SPL or Token-2022 token: mint and freeze authority, Token-2022 extensions, metadata mutability and holder concentration. Informational only, not financial advice.'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Solana Token Auditor | SPL Token Analysis Tool - CloakForge',
  description: TOKEN_AUDITOR_DESCRIPTION,
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
    description: TOKEN_AUDITOR_DESCRIPTION,
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
    description: TOKEN_AUDITOR_DESCRIPTION,
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

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <>
    <ToolStructuredData
      description={TOKEN_AUDITOR_DESCRIPTION}
      faqs={tokenAuditorFAQs}
      howToSteps={[
        { name: 'Enter a Token Address', text: 'Paste the Solana token mint address you want to check.' },
        {
          name: 'Run the Checks',
          text: "CloakForge reads the token's authorities, Token-2022 extensions, metadata and largest holders from Solana mainnet.",
        },
        {
          name: 'Review the Findings',
          text: 'Each check is marked pass, warning, high risk or not analyzed, with a short explanation. Informational only, not financial advice.',
        },
      ]}
      name='Token Auditor'
      path='/tools/token-auditor'
    />
    {children}
  </>
)

export default Layout
