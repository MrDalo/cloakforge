import { Coins, Droplets, Flame, Shield, Lock, UserX, Send } from 'lucide-react'

export interface NavigationItem {
	title: string
	href: string
	description: string
	icon: typeof Coins
}

export interface NavigationGroup {
	title: string
	items: NavigationItem[]
}

export const navigationItems: NavigationGroup[] = [
	{
		title: 'Tools',
		items: [
			{
				title: 'Token Creator',
				href: '/token-creator',
				description: 'Create professional SPL tokens with custom metadata',
				icon: Coins,
			},
			{
				title: 'Create Liquidity',
				href: '/create-liquidity',
				description: 'Add liquidity to DEXs and create trading pairs',
				icon: Droplets,
			},
			{
				title: 'Burn Tokens',
				href: '/burn-tokens',
				description: 'Permanently remove tokens from circulation',
				icon: Flame,
			},
			{
				title: 'Revoke Mint Authority',
				href: '/revoke-mint-authority',
				description: 'Permanently disable token minting',
				icon: Shield,
			},
			{
				title: 'Revoke Freeze Authority',
				href: '/revoke-freeze-authority',
				description: 'Remove freeze capabilities for decentralization',
				icon: Lock,
			},
			{
				title: 'Freeze Accounts',
				href: '/freeze-accounts',
				description: 'Temporarily disable token accounts',
				icon: UserX,
			},
			{
				title: 'Transaction Multisender',
				href: '/transaction-multisender',
				description: 'Send tokens to multiple addresses simultaneously',
				icon: Send,
			},
		],
	},
]
