import type { Metadata } from 'next'
import { ToolStructuredData } from '@/components/common'
import { liquidityProviderFAQ } from '@/components/pages/LiquidityProviderPage/FAQSection/faqData'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Raydium Liquidity Provider - CloakForge',
  description:
    'Create Raydium CPMM and CLMM liquidity pools with a guided form, input checks and a cost preview. Transactions are signed in your own wallet.',
  keywords: 'Raydium liquidity provider, CPMM, CLMM, Solana DeFi, pool creation, liquidity pools, cloakforge',
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
    canonical: 'https://cloakforge.app/tools/liquidity-provider',
  },
  openGraph: {
    title: 'Raydium Liquidity Provider - CloakForge',
    description: 'Create Raydium CPMM and CLMM liquidity pools with a guided form and a cost preview before you sign.',
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
    description: 'Create CPMM and CLMM pools on Raydium with a guided form and a cost preview.',
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

const LiquidityProviderLayout = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <>
    <ToolStructuredData
      description='Create Raydium CPMM and CLMM liquidity pools with a guided form, input checks and a cost preview. Transactions are signed in your own wallet.'
      faqs={liquidityProviderFAQ}
      howToSteps={[
        { name: 'Connect Your Wallet', text: 'Connect a Solana wallet holding both tokens in the pair.' },
        { name: 'Select the Token Pair', text: 'Choose the two tokens you want to provide liquidity for.' },
        { name: 'Configure the Pool', text: 'Pick a CPMM or CLMM pool type and set the initial pool parameters.' },
        { name: 'Sign and Create the Pool', text: 'Sign the transaction in your wallet to create the Raydium liquidity pool.' },
      ]}
      name='Liquidity Provider'
      path='/tools/liquidity-provider'
    />
    {children}
  </>
)

export default LiquidityProviderLayout
