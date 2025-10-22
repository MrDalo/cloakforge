import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import '@/components/common/WalletConnectionButton/WalletConnectionButton.css'
import AppProvider from '@/providers/AppProvider'
import Notification from '@/components/ui/sonner'
import { GlobalHeader } from '@/components/common/GlobalHeader'
import { GlobalFooter } from '@/components/common/GlobalFooter'
import { AnnouncementBanner } from '@/components/common/AnnouncementBanner'
import { DM_Sans } from 'next/font/google'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
  description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
  keywords:
    'Solana blockchain, Solana tools, Solana token creator, create liquidity pools, Solana multisender, burn tokens Solana, revoke mint authority, blockchain tools, crypto tools, DeFi tools, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
    description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
    url: 'https://cloakforge.app/transaction-multisender',
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
    title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
    description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
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
    title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
  },
}

const DMSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
})

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <html data-scroll-behavior='smooth' lang='en'>
    <body className={`${DMSans.variable} font-dm-sans bg-background relative flex w-full flex-col flex-nowrap scroll-smooth antialiased`}>
      {/* ⚠️ CACHE COMPONENTS: AppProvider is async (fetches tool configs), must be wrapped in Suspense */}
      <Suspense
        fallback={
          <div className='flex h-screen w-screen items-center justify-center'>
            <LoadingSpinner />
          </div>
        }
      >
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
      </Suspense>
    </body>
  </html>
)

export default RootLayout
