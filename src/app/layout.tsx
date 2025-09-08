import type { Metadata } from 'next'
import './globals.css'
import '@/components/common/WalletConnectionButton/WalletConnectionButton.css'
import GlobalBody from '@/components/common/GlobalBody'
import AppProvider from '@/providers/AppProvider'
import Notification from '@/components/ui/sonner'
import { GlobalHeader } from '@/components/common/GlobalHeader'
import { GlobalFooter } from '@/components/common/GlobalFooter'
import { AnnouncementBanner } from '@/components/common/AnnouncementBanner'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
  description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
  keywords:
    'Solana blockchain, Solana tools, Solana token creator, create liquidity pools, Solana multisender, burn tokens Solana, revoke mint authority, blockchain tools, crypto tools, DeFi tools, solcloak',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
    description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
    url: 'https://solcloak.app/transaction-multisender',
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
    title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
    description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
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
    title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
  },
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <html data-scroll-behavior='smooth' lang='en'>
    <GlobalBody>
      <AppProvider>
        <div className='bg-background relative flex min-h-screen w-full flex-col'>
          {/* Announcement Banner */}
          <AnnouncementBanner />

          {/* Header Navigation */}
          <GlobalHeader />

          {/* Main Content */}
          <main className='w-full flex-1'>{children}</main>

          {/* Global Footer */}
          <GlobalFooter />

          {/* Notifications */}
          <Notification />
        </div>
      </AppProvider>
    </GlobalBody>
  </html>
)

export default RootLayout
