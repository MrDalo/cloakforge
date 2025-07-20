import {
	Coins,
	Droplets,
	Flame,
	Shield,
	Lock,
	UserX,
	Send,
	Calculator,
	Zap,
	TrendingDown,
	Info,
	CheckCircle,
	type LucideIcon,
} from 'lucide-react'

export interface ServiceFee {
	service: string
	icon: LucideIcon
	fee: string
	description: string
	complexity: 'Low' | 'Medium' | 'High' | 'Variable'
	estimatedNetwork: string
	popular: boolean
}

export interface FeeComponent {
	component: string
	description: string
	icon: LucideIcon
	color: 'primary' | 'secondary'
}

export interface OptimizationTip {
	tip: string
	description: string
	icon: LucideIcon
}

export const servicesFees: ServiceFee[] = [
	{
		service: 'Token Creator',
		icon: Coins,
		fee: '0.1 SOL',
		description: 'Create professional SPL tokens',
		complexity: 'Medium',
		estimatedNetwork: '~0.01 SOL',
		popular: true,
	},
	{
		service: 'Create Liquidity',
		icon: Droplets,
		fee: '0.05 SOL',
		description: 'Add liquidity to DEX pools',
		complexity: 'Low',
		estimatedNetwork: '~0.005 SOL',
		popular: true,
	},
	{
		service: 'Burn Tokens',
		icon: Flame,
		fee: '0.02 SOL',
		description: 'Permanently remove tokens',
		complexity: 'Low',
		estimatedNetwork: '~0.003 SOL',
		popular: false,
	},
	{
		service: 'Revoke Mint Authority',
		icon: Shield,
		fee: '0.03 SOL',
		description: 'Disable token minting forever',
		complexity: 'Low',
		estimatedNetwork: '~0.003 SOL',
		popular: true,
	},
	{
		service: 'Revoke Freeze Authority',
		icon: Lock,
		fee: '0.03 SOL',
		description: 'Remove freeze capabilities',
		complexity: 'Low',
		estimatedNetwork: '~0.003 SOL',
		popular: false,
	},
	{
		service: 'Freeze Accounts',
		icon: UserX,
		fee: '0.02 SOL',
		description: 'Temporarily disable accounts',
		complexity: 'Low',
		estimatedNetwork: '~0.003 SOL',
		popular: false,
	},
	{
		service: 'Transaction Multisender',
		icon: Send,
		fee: '0.01 SOL per 10 transfers',
		description: 'Batch token transfers',
		complexity: 'Variable',
		estimatedNetwork: '~0.005 SOL per address',
		popular: true,
	},
]

export const feeBreakdown: FeeComponent[] = [
	{
		component: 'Platform Fee',
		description: 'Fixed fee for using our professional tools',
		icon: Zap,
		color: 'primary',
	},
	{
		component: 'Network Fee',
		description: 'Variable Solana blockchain transaction cost',
		icon: Calculator,
		color: 'secondary',
	},
]

export const costOptimization: OptimizationTip[] = [
	{
		tip: 'Batch Operations',
		description: 'Use multisender for multiple transfers to save on fees',
		icon: TrendingDown,
	},
	{
		tip: 'Off-Peak Usage',
		description: 'Network fees are typically lower during off-peak hours',
		icon: Info,
	},
	{
		tip: 'Bundle Services',
		description: 'Combine multiple operations when possible',
		icon: CheckCircle,
	},
]
