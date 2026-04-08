import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liquidity Provider | CloakForge',
  description:
    'Create professional liquidity pools on Raydium with CPMM and CLMM support. Advanced features, smart validation, and direct SDK integration.',
  keywords: ['Raydium', 'liquidity provider', 'CPMM', 'CLMM', 'Solana', 'DeFi', 'pool creation'],
  openGraph: {
    title: 'Raydium Liquidity Provider - CloakForge',
    description: 'Professional tools for creating liquidity pools on Raydium with advanced features and smart validation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raydium Liquidity Provider - CloakForge',
    description: 'Create CPMM and CLMM pools on Raydium with professional-grade tools.',
  },
}

export default function LiquidityProviderLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return children
}
