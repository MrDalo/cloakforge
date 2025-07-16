import type { Metadata } from 'next'
import './globals.css'
import GlobalBody from '@/components/common/GlobalBody'
import GlobalHeader from '@/components/common/GlobalHeader'
import AppProvider from '@/providers/AppProvider'
import Notification from '@/components/ui/sonner'
import Sidebar from '@/components/common/Sidebar'

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
    <GlobalBody>
      <AppProvider>
        <div className='bg-background relative flex w-full flex-col flex-nowrap lg:flex-row lg:overflow-y-hidden'>
          <Sidebar />
          <div className='relative flex h-screen w-full flex-col flex-nowrap overflow-y-auto duration-300 lg:w-auto lg:flex-1'>
            <GlobalHeader />
            <main className='bg-background relative w-full flex-1 overflow-x-hidden overflow-y-auto pt-10 pb-[10vh]'>
              {children}
            </main>
          </div>
          <Notification />
        </div>
      </AppProvider>
    </GlobalBody>
  </html>
)

export default RootLayout
