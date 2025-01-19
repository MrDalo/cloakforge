import type { Metadata } from 'next'
import './globals.css'
import Body from '@/components/core/body'
import Sidebar from '@/components/core/Sidebar'
import Main from '@/components/core/main'
import Header from '@/components/core/header'
import AppProvider from '@/providers/app-provider'
import Notification from '@/components/ui/sonner'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
  description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
  keywords:
    'Solana blockchain, Solana tools, Solana token creator, create liquidity pools, Solana multisender, burn tokens Solana, revoke mint authority, blockchain tools, crypto tools, DeFi tools, cryptoforge',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title:
      'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
    description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
    url: 'https://cryptoforge.app/transaction-multisender',
    type: 'website',
    siteName: 'CryptoForge',
    images: [
      {
        url: 'https://cryptoforge.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CryptoForge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cryptoforge',
    creator: '@cryptoforge',
    title:
      'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
    description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
    images: [
      {
        url: 'https://cryptoforge.app/og-image.png',
        alt: 'CryptoForge',
        width: 1200,
        height: 630,
      },
    ],
  },
  appleWebApp: {
    title:
      'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
  },
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <html lang='en'>
    <AppProvider>
      <Body>
        <Sidebar />
        <div className='flex w-full flex-col'>
          <Header />
          <Main>{children}</Main>
        </div>
        <Notification />
      </Body>
    </AppProvider>
  </html>
)

export default RootLayout
