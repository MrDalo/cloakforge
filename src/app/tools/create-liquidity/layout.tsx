import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Create Solana Liquidity Pool | Add Liquidity to DEX - CloakForge',
  description:
    'Create liquidity pools on Solana DEXs like Raydium and Orca. Add liquidity to earn fees and rewards. Easy-to-use tool for Solana DeFi liquidity provision.',
  keywords:
    'Solana liquidity pool, create liquidity, add liquidity, Raydium liquidity, Orca pools, Solana DeFi, DEX liquidity, liquidity provision, yield farming, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - CloakForge',
    description:
      'Build Solana liquidity pools with ease using our intuitive tool. Provide liquidity to decentralized exchanges and earn rewards. Securely manage Solana assets in liquidity pools.',
    url: 'https://cloakforge.app/tools/create-liquidity',
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
    title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - CloakForge',
    description:
      'Build Solana liquidity pools with ease using our intuitive tool. Provide liquidity to decentralized exchanges and earn rewards. Securely manage Solana assets in liquidity pools.',
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
    title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
