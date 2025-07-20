import { Shield, Zap, Database, type LucideIcon } from 'lucide-react'

export interface PlatformFeature {
	icon: LucideIcon
	text: string
}

export interface QuickStat {
	label: string
	value: string
}

export const platformFeatures: PlatformFeature[] = [
	{ icon: Zap, text: 'Lightning Fast' },
	{ icon: Shield, text: 'Secure' },
	{ icon: Database, text: 'On-Chain' },
]

export const quickStats: QuickStat[] = [
	{ label: 'Tools Available', value: '7+' },
	{ label: 'Zero Data Collection', value: '100%' },
	{ label: 'Network Fees', value: 'Minimal' },
]
