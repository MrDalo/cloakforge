import type { Metadata } from 'next'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Raydium Liquidity Provider - CloakForge',
  description:
    'Create professional liquidity pools on Raydium with CPMM and CLMM support. Advanced features, smart validation, and direct SDK integration.',
  keywords: 'Raydium liquidity provider, CPMM, CLMM, Solana DeFi, pool creation, liquidity pools, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Raydium Liquidity Provider - CloakForge',
    description: 'Professional tools for creating liquidity pools on Raydium with advanced features and smart validation.',
    url: 'https://cloakforge.app/tools/liquidity-provider',
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
    title: 'Raydium Liquidity Provider - CloakForge',
    description: 'Create CPMM and CLMM pools on Raydium with professional-grade tools.',
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
    title: 'Raydium Liquidity Provider - CloakForge',
  },
}

export default function LiquidityProviderLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return children
}
