import type { Metadata } from 'next'
import './globals.css'
import '@/components/common/WalletConnectionButton/WalletConnectionButton.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import AppProvider from '@/providers/AppProvider'
import Notification from '@/components/ui/sonner'
import { GlobalHeader } from '@/components/common/GlobalHeader'
import { GlobalFooter } from '@/components/common/GlobalFooter'
import { DonationSection } from '@/components/common/DonationSection'
import { AnnouncementBanner } from '@/components/common/AnnouncementBanner'
import { JsonLd } from '@/components/common/JsonLd'
import { DM_Sans } from 'next/font/google'

const DMSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true,
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://cloakforge.app'),
  applicationName: 'CloakForge',
  title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
  description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
  keywords:
    'Solana blockchain, Solana tools, Solana token creator, create liquidity pools, Solana multisender, burn tokens Solana, revoke mint authority, blockchain tools, crypto tools, DeFi tools, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  alternates: {
    canonical: 'https://cloakforge.app',
  },
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
  openGraph: {
    title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
    description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
    url: 'https://cloakforge.app',
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

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CloakForge',
  url: 'https://cloakforge.app',
  logo: 'https://cloakforge.app/cloakforge-logo.svg',
  sameAs: ['https://twitter.com/cloakforge', 'https://www.instagram.com/cloakforge.app'],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CloakForge',
  url: 'https://cloakforge.app',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://cloakforge.app/blog?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => (
  <html data-scroll-behavior='smooth' lang='en'>
    <body className={`${DMSans.variable} font-dm-sans bg-background relative flex w-full flex-col flex-nowrap scroll-smooth antialiased`}>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      {/* Next.js automatically wraps this in Suspense when loading.tsx exists */}
      <AppProvider>
        <div className='bg-background relative flex min-h-screen w-full flex-col'>
          {/* Announcement Banner */}
          <AnnouncementBanner />

          {/* Header Navigation */}
          <GlobalHeader />

          {/* Main Content */}
          <main className='w-full flex-1'>{children}</main>

          {/* Donation Section */}
          <DonationSection />

          {/* Global Footer */}
          <GlobalFooter />

          {/* Notifications */}
          <Notification />
        </div>
      </AppProvider>
    </body>
  </html>
)

export default RootLayout
