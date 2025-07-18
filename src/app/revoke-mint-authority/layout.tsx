import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
	applicationName: 'CryptoForge',
	title: 'Revoke Mint Authority | Secure Solana Token Management - CryptoForge',
	description:
		'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
	keywords:
		'revoke mint authority, Solana minting control, token mint authority, Solana token management, secure minting, revoke permissions, cryptoforge',
	creator: 'CryptoForge',
	publisher: 'CryptoForge',
	robots: 'index, follow',
	openGraph: {
		title: 'Revoke Mint Authority | Secure Solana Token Management - CryptoForge',
		description:
			'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
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
		title: 'Revoke Mint Authority | Secure Solana Token Management - CryptoForge',
		description:
			'Revoke mint authority for Solana tokens and enhance security. Control your token’s minting permissions with this essential tool to protect against unauthorized minting.',
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
		title: 'Revoke Mint Authority | Secure Solana Token Management - CryptoForge',
	},
}

const Layout = ({
	children,
}: Readonly<{
	children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
