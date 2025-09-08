import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Burn Solana Tokens | Reduce Token Supply Tool - SolCloak',
  description: `Permanently burn Solana SPL tokens to reduce circulating supply and manage tokenomics. Secure token burning tool for Solana blockchain. Destroy tokens irreversibly.`,
  keywords:
    'burn Solana tokens, reduce token supply, SPL token burning, Solana tokenomics, token destruction, deflationary tokens, burn mechanism, solcloak',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Burn Solana Tokens | Token Burning Tool - SolCloak',
    description: `Burn Solana tokens to reduce supply or manage tokenomics. Our simple tool lets you destroy tokens securely on the Solana blockchain. Take control of your token's economy.`,
    url: 'https://solcloak.app/tools/burn-tokens',
    type: 'website',
    siteName: 'SolCloak',
    images: [
      {
        url: 'https://solcloak.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SolCloak',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@solcloak',
    creator: '@solcloak',
    title: 'Burn Solana Tokens | Token Burning Tool - SolCloak',
    description: `Burn Solana tokens to reduce supply or manage tokenomics. Our simple tool lets you destroy tokens securely on the Solana blockchain. Take control of your token's economy.`,
    images: [
      {
        url: 'https://solcloak.app/og-image.png',
        alt: 'SolCloak',
        width: 1200,
        height: 630,
      },
    ],
  },
  appleWebApp: {
    title: 'Burn Solana Tokens | Token Burning Tool - SolCloak',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
