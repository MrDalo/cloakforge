import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'SolCloak',
  title: 'Privacy Policy | SolCloak',
  description:
    "Learn about SolCloak's privacy policy and how we collect, use, and protect your personal information. Understand our commitment to your privacy and data security.",
  keywords:
    'privacy policy, data protection, personal information, privacy rights, SolCloak privacy, data security, GDPR compliance, user privacy',
  creator: 'SolCloak',
  publisher: 'SolCloak',
  robots: 'index, follow',
  openGraph: {
    title: 'Privacy Policy | SolCloak',
    description:
      "Learn about SolCloak's privacy policy and how we collect, use, and protect your personal information. Understand our commitment to your privacy and data security.",
    url: 'https://solcloak.app/privacy-policy',
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
    title: 'Privacy Policy | SolCloak',
    description:
      "Learn about SolCloak's privacy policy and how we collect, use, and protect your personal information. Understand our commitment to your privacy and data security.",
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
    title: 'Privacy Policy | SolCloak',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
