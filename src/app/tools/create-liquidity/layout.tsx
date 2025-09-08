import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Create Solana Liquidity Pool | Add Liquidity to DEX - SolCloak',
  description:
    'Create liquidity pools on Solana DEXs like Raydium and Orca. Add liquidity to earn fees and rewards. Easy-to-use tool for Solana DeFi liquidity provision.',
  keywords:
    'Solana liquidity pool, create liquidity, add liquidity, Raydium liquidity, Orca pools, Solana DeFi, DEX liquidity, liquidity provision, yield farming, solcloak',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - SolCloak',
    description:
      'Build Solana liquidity pools with ease using our intuitive tool. Provide liquidity to decentralized exchanges and earn rewards. Securely manage Solana assets in liquidity pools.',
    url: 'https://solcloak.app/tools/create-liquidity',
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
    title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - SolCloak',
    description:
      'Build Solana liquidity pools with ease using our intuitive tool. Provide liquidity to decentralized exchanges and earn rewards. Securely manage Solana assets in liquidity pools.',
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
    title: 'Create Solana Liquidity Pools | Liquidity Creation Tool - SolCloak',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
