import { Shield, Lock, Globe, CheckCircle, X, Key, FileText } from 'lucide-react'

export interface SecurityFeature {
	icon: typeof Shield
	title: string
	description: string
	details: string[]
	color: 'primary' | 'secondary'
}

export interface DataPrivacyPoint {
	icon: typeof X | typeof CheckCircle
	text: string
	description: string
	status: 'protected' | 'minimal'
}

export interface ComplianceItem {
	icon: typeof FileText
	title: string
	description: string
}

export const securityFeatures: SecurityFeature[] = [
	{
		icon: Shield,
		title: 'End-to-End Security',
		description: 'All transactions are cryptographically secured and verified on-chain.',
		details: ['Cryptographic signatures', 'On-chain verification', 'Immutable records'],
		color: 'primary',
	},
	{
		icon: Key,
		title: 'Self-Custody Only',
		description: 'We never hold your keys or have access to your funds at any time.',
		details: ['Non-custodial design', 'Your keys, your crypto', 'Zero fund access'],
		color: 'secondary',
	},
	{
		icon: Lock,
		title: 'Privacy by Design',
		description: 'Built from the ground up with privacy-first architecture.',
		details: ['Minimal data collection', 'Anonymous usage', 'Privacy-first code'],
		color: 'primary',
	},
	{
		icon: Globe,
		title: 'Decentralized Access',
		description: 'No central servers storing your data or controlling access.',
		details: ['Peer-to-peer connections', 'Distributed architecture', 'No single point of failure'],
		color: 'secondary',
	},
]

export const dataPrivacyPoints: DataPrivacyPoint[] = [
	{
		icon: X,
		text: 'No Cookies',
		description: "We don't use tracking cookies",
		status: 'protected',
	},
	{
		icon: X,
		text: 'No IP Logging',
		description: 'Your IP address is not stored',
		status: 'protected',
	},
	{
		icon: X,
		text: 'No Analytics',
		description: 'No Google Analytics or tracking',
		status: 'protected',
	},
	{
		icon: X,
		text: 'No User Profiles',
		description: "We don't build user profiles",
		status: 'protected',
	},
	{
		icon: CheckCircle,
		text: 'Wallet Address Only',
		description: 'Only your public wallet address',
		status: 'minimal',
	},
	{
		icon: CheckCircle,
		text: 'Transaction Data',
		description: "Only what's publicly on-chain",
		status: 'minimal',
	},
]

export const complianceItems: ComplianceItem[] = [
	{
		icon: Shield,
		title: 'Non-Custodial',
		description: 'We never hold or have access to your private keys',
	},
	{
		icon: Lock,
		title: 'Privacy First',
		description: 'Built with zero-knowledge and minimal data principles',
	},
	{
		icon: Globe,
		title: 'No KYC Required',
		description: 'Access our services without identity verification',
	},
]

export const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
}

export const cardVariants = {
	hidden: {
		opacity: 0,
		y: 50,
		scale: 0.9,
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: 0.6,
			ease: [0.25, 0.46, 0.45, 0.94] as const,
		},
	},
}
