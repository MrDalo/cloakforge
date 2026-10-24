import type { Metadata } from 'next'
import './globals.css'
import '@/components/common/WalletConnectionButton/WalletConnectionButton.css'
import '@/styles/wallet-adapter.css'
import AppProvider from '@/providers/AppProvider'
import Notification from '@/components/ui/sonner'
import { GlobalHeader } from '@/components/common/GlobalHeader'
import { GlobalFooter } from '@/components/common/GlobalFooter'
import { DonationSection } from '@/components/common/DonationSection'
import { AnnouncementBanner } from '@/components/common/AnnouncementBanner'
import { NetworkBanner } from '@/components/common/NetworkBanner'
import { JsonLd } from '@/components/common/JsonLd'
import { getSiteUrl, toSiteUrl } from '@/lib/config/siteUrl'
import { IS_SHOWCASE_MODE } from '@/lib/config/network'
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
  // Relative metadata URLs (canonicals, OG images) resolve against the single canonical origin (M8).
  metadataBase: new URL(getSiteUrl()),
  applicationName: 'CloakForge',
  title: 'Solana Blockchain Tools | Create Tokens, Manage Liquidity, and More',
  description: `Unlock the full potential of the Solana blockchain with our all-in-one suite of tools. Create Solana tokens, manage liquidity pools, burn tokens, revoke mint authority, and multisend transactions effortlessly.`,
  keywords:
    'Solana blockchain, Solana tools, Solana token creator, create liquidity pools, Solana multisender, burn tokens Solana, revoke mint authority, blockchain tools, crypto tools, DeFi tools, cloakforge',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  // No root `alternates.canonical` / `openGraph.url`: every page without its own would inherit them and
  // point at the homepage. Pages set them themselves (relative paths resolve against metadataBase).
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
    type: 'website',
    siteName: 'CloakForge',
    images: [
      {
        url: '/og-image.png',
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
        url: '/og-image.png',
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
  url: getSiteUrl(),
  logo: toSiteUrl('/cloakforge-logo.svg'),
  sameAs: ['https://twitter.com/cloakforge', 'https://www.instagram.com/cloakforge.app'],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CloakForge',
  url: getSiteUrl(),
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: toSiteUrl('/blog?search={search_term_string}'),
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
          {/* Devnet showcase notice (build-time; not dismissible) */}
          <NetworkBanner />

          {/* Announcement Banner */}
          <AnnouncementBanner />

          {/* Header Navigation */}
          <GlobalHeader />

          {/* Main Content */}
          <main className='w-full flex-1'>{children}</main>

          {/* Donation Section — devnet SOL has no value, so no donations on the showcase */}
          {!IS_SHOWCASE_MODE && <DonationSection />}

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
