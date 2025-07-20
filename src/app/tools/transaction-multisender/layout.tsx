import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
	applicationName: 'CryptoForge',
	title: 'Solana Multisender | Batch Send Solana Tokens - CryptoForge',
	description:
		'Send Solana tokens to multiple recipients at once with the Solana multisender tool. Save time and gas fees by batch sending transactions on the Solana blockchain.',
	keywords:
		'Solana multisender, batch send tokens, Solana transaction tool, multisend crypto, Solana batch transaction, send Solana tokens, cryptoforge',
	creator: 'CryptoForge',
	publisher: 'CryptoForge',
	robots: 'index, follow',
	openGraph: {
		title: 'Solana Multisender | Batch Send Solana Tokens - CryptoForge',
		description:
			'Send Solana tokens to multiple recipients at once with the Solana multisender tool. Save time and gas fees by batch sending transactions on the Solana blockchain.',
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
		title: 'Solana Multisender | Batch Send Solana Tokens - CryptoForge',
		description:
			'Send Solana tokens to multiple recipients at once with the Solana multisender tool. Save time and gas fees by batch sending transactions on the Solana blockchain.',
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
		title: 'Solana Multisender | Batch Send Solana Tokens',
	},
}

const Layout = ({
	children,
}: Readonly<{
	children: React.ReactNode
}>): React.ReactNode => <>{children}</>

export default Layout
