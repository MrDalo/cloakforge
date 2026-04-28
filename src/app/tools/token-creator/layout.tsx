import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Create Solana Token | SPL Token Creator Tool - CloakForge',
  description:
    'Create custom Solana SPL tokens instantly with our no-code tool. Generate new tokens with custom names, symbols, decimals, and supply. Build on Solana blockchain in minutes for 0.19 SOL.',
  keywords:
    'create Solana token, SPL token creator, mint Solana token, token generator, Solana blockchain, custom token creator, no-code token creation, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
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
}>): React.ReactNode => <>{children}</>

export default Layout
