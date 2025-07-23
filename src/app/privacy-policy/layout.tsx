import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CryptoForge',
  title: 'Privacy Policy | CryptoForge',
  description:
    "Learn about CryptoForge's privacy policy and how we collect, use, and protect your personal information. Understand our commitment to your privacy and data security.",
  keywords:
    'privacy policy, data protection, personal information, privacy rights, CryptoForge privacy, data security, GDPR compliance, user privacy',
  creator: 'CryptoForge',
  publisher: 'CryptoForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Privacy Policy | CryptoForge',
    description:
      "Learn about CryptoForge's privacy policy and how we collect, use, and protect your personal information. Understand our commitment to your privacy and data security.",
    url: 'https://cryptoforge.app/privacy-policy',
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
    title: 'Privacy Policy | CryptoForge',
    description:
      "Learn about CryptoForge's privacy policy and how we collect, use, and protect your personal information. Understand our commitment to your privacy and data security.",
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
    title: 'Privacy Policy | CryptoForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
