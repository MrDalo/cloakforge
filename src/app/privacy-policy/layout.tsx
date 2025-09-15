import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  applicationName: 'CloakForge',
  title: 'Privacy Policy | CloakForge',
  description:
    "Learn about CloakForge's privacy policy and how we collect, use, and protect your personal information. Understand our commitment to your privacy and data security.",
  keywords:
    'privacy policy, data protection, personal information, privacy rights, CloakForge privacy, data security, GDPR compliance, user privacy',
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: 'index, follow',
  openGraph: {
    title: 'Privacy Policy | CloakForge',
    description:
      "Learn about CloakForge's privacy policy and how we collect, use, and protect your personal information. Understand our commitment to your privacy and data security.",
    url: 'https://cloakforge.app/privacy-policy',
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
    title: 'Privacy Policy | CloakForge',
    description:
      "Learn about CloakForge's privacy policy and how we collect, use, and protect your personal information. Understand our commitment to your privacy and data security.",
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
    title: 'Privacy Policy | CloakForge',
  },
}

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
