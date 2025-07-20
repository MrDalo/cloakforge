'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Shield, Eye, Lock, Globe, CheckCircle, X, Key, FileText, AlertTriangle } from 'lucide-react'

const securityFeatures = [
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

const dataPrivacyPoints = [
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

const complianceItems = [
	{
		icon: FileText,
		title: 'Open Source',
		description: 'Our code is public and auditable',
		link: 'View on GitHub',
	},
	{
		icon: Shield,
		title: 'Security Audits',
		description: 'Regular third-party security reviews',
		link: 'View Reports',
	},
	{
		icon: Globe,
		title: 'Transparency',
		description: 'Full transparency in our operations',
		link: 'Read Our Policy',
	},
]

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
}

const cardVariants = {
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
			ease: 'easeOut',
		},
	},
}

export const SecurityPrivacySection = () => (
	<section className='from-muted/20 via-background to-muted/10 relative overflow-hidden bg-gradient-to-br px-6 py-20'>
		{/* Background Elements */}
		<div className='security-mesh absolute inset-0 opacity-30' />
		<div className='absolute inset-0 overflow-hidden'>
			<motion.div
				animate={{
					rotate: [0, 360],
					scale: [1, 1.1, 1],
				}}
				className='border-secondary/20 encrypted-pattern absolute top-20 right-20 h-32 w-32 rounded-full border-2'
				transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
			/>
			<motion.div
				animate={{
					x: [0, 50, 0],
					y: [0, -30, 0],
				}}
				className='bg-primary/10 blockchain-pattern absolute bottom-20 left-20 h-24 w-24 rounded-2xl'
				transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
			/>
		</div>

		<div className='relative z-10 container mx-auto max-w-7xl'>
			{/* Section Header */}
			<motion.div
				className='mb-16 text-center'
				initial={{ opacity: 0, y: 30 }}
				transition={{ duration: 0.8 }}
				viewport={{ once: true }}
				whileInView={{ opacity: 1, y: 0 }}
			>
				<motion.div
					className='bg-secondary/10 text-secondary mb-6 inline-flex items-center rounded-full px-4 py-2'
					initial={{ opacity: 0, scale: 0 }}
					transition={{ delay: 0.2, duration: 0.5 }}
					viewport={{ once: true }}
					whileInView={{ opacity: 1, scale: 1 }}
				>
					<Shield className='mr-2 h-4 w-4' />
					<span className='text-sm'>Security & Privacy</span>
				</motion.div>

				<h2 className='mb-6 text-3xl md:text-5xl'>
					Your Privacy & Security
					<span className='privacy-text-gradient block'>Are Our Priority</span>
				</h2>
				<p className='text-muted-foreground mx-auto max-w-3xl text-xl'>
					We believe in transparency about what we collect (very little) and what we don't collect (almost everything). Your data stays
					yours, your privacy is protected.
				</p>
			</motion.div>

			{/* Security Features Grid */}
			<motion.div
				className='mb-20 grid grid-cols-1 gap-8 md:grid-cols-2'
				initial='hidden'
				variants={containerVariants}
				viewport={{ once: true }}
				whileInView='visible'
			>
				{securityFeatures.map((feature, index) => {
					const Icon = feature.icon
					return (
						<motion.div className='group' key={index} variants={cardVariants} whileHover={{ y: -5 }}>
							<Card className='hover:border-secondary/30 bg-card privacy-glow h-full border-2 transition-all duration-300 hover:shadow-xl'>
								<CardContent className='p-8'>
									<motion.div
										className={`h-16 w-16 rounded-2xl ${feature.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'} mb-6 flex items-center justify-center ${feature.color === 'primary' ? 'group-hover:bg-primary/20' : 'group-hover:bg-secondary/20'} shield-pulse transition-all duration-300`}
										transition={{ duration: 0.3 }}
										whileHover={{ scale: 1.1, rotate: 5 }}
									>
										<Icon className={`h-8 w-8 ${feature.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
									</motion.div>

									<h3 className='group-hover:text-secondary mb-4 text-2xl transition-colors duration-300'>{feature.title}</h3>
									<p className='text-muted-foreground mb-6 leading-relaxed'>{feature.description}</p>

									<div className='space-y-3'>
										{feature.details.map((detail, detailIndex) => (
											<motion.div
												className='flex items-center'
												initial={{ opacity: 0, x: -20 }}
												key={detailIndex}
												transition={{ delay: index * 0.1 + detailIndex * 0.05, duration: 0.4 }}
												viewport={{ once: true }}
												whileInView={{ opacity: 1, x: 0 }}
											>
												<CheckCircle className='text-secondary mr-3 h-5 w-5 flex-shrink-0' />
												<span className='text-muted-foreground text-sm'>{detail}</span>
											</motion.div>
										))}
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)
				})}
			</motion.div>

			{/* Data Privacy Table */}
			<motion.div
				className='mb-20'
				initial={{ opacity: 0, y: 30 }}
				transition={{ delay: 0.3, duration: 0.8 }}
				viewport={{ once: true }}
				whileInView={{ opacity: 1, y: 0 }}
			>
				<Card className='border-border bg-card border-2 shadow-xl'>
					<CardContent className='p-8'>
						<div className='mb-8 text-center'>
							<Eye className='text-primary mx-auto mb-4 h-12 w-12' />
							<h3 className='mb-4 text-2xl md:text-3xl'>What We Do & Don't Collect</h3>
							<p className='text-muted-foreground'>Complete transparency about data collection and usage</p>
						</div>

						<div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
							{/* What We DON'T Collect */}
							<div>
								<h4 className='mb-6 flex items-center text-xl'>
									<X className='text-destructive mr-2 h-6 w-6' />
									What We DON'T Collect
								</h4>
								<div className='space-y-4'>
									{dataPrivacyPoints
										.filter((point) => point.status === 'protected')
										.map((point, index) => (
											<motion.div
												className='bg-destructive/5 border-destructive/20 flex items-start space-x-3 rounded-lg border p-4'
												initial={{ opacity: 0, x: -20 }}
												key={index}
												transition={{ delay: 0.1 * index, duration: 0.4 }}
												viewport={{ once: true }}
												whileInView={{ opacity: 1, x: 0 }}
											>
												<X className='text-destructive mt-0.5 h-5 w-5 flex-shrink-0' />
												<div>
													<div className='text-destructive font-medium'>{point.text}</div>
													<div className='text-muted-foreground text-sm'>{point.description}</div>
												</div>
											</motion.div>
										))}
								</div>
							</div>

							{/* What We DO Collect (Minimal) */}
							<div>
								<h4 className='mb-6 flex items-center text-xl'>
									<CheckCircle className='text-secondary mr-2 h-6 w-6' />
									What We DO Collect (Minimal)
								</h4>
								<div className='space-y-4'>
									{dataPrivacyPoints
										.filter((point) => point.status === 'minimal')
										.map((point, index) => (
											<motion.div
												className='bg-secondary/5 border-secondary/20 flex items-start space-x-3 rounded-lg border p-4'
												initial={{ opacity: 0, x: 20 }}
												key={index}
												transition={{ delay: 0.1 * index, duration: 0.4 }}
												viewport={{ once: true }}
												whileInView={{ opacity: 1, x: 0 }}
											>
												<CheckCircle className='text-secondary mt-0.5 h-5 w-5 flex-shrink-0' />
												<div>
													<div className='text-secondary font-medium'>{point.text}</div>
													<div className='text-muted-foreground text-sm'>{point.description}</div>
												</div>
											</motion.div>
										))}
								</div>
							</div>
						</div>

						<motion.div
							className='bg-info/10 border-info/20 mt-8 rounded-lg border p-4'
							initial={{ opacity: 0, y: 20 }}
							transition={{ delay: 0.5, duration: 0.6 }}
							viewport={{ once: true }}
							whileInView={{ opacity: 1, y: 0 }}
						>
							<div className='flex items-start space-x-3'>
								<AlertTriangle className='text-info mt-0.5 h-5 w-5 flex-shrink-0' />
								<div className='text-muted-foreground text-sm'>
									<strong>Note:</strong> The minimal data we collect (wallet addresses and transaction data) is already publicly available
									on the Solana blockchain. We don't add any additional tracking.
								</div>
							</div>
						</motion.div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Compliance & Transparency */}
			<motion.div
				className='grid grid-cols-1 gap-8 md:grid-cols-3'
				initial='hidden'
				variants={containerVariants}
				viewport={{ once: true }}
				whileInView='visible'
			>
				{complianceItems.map((item, index) => {
					const Icon = item.icon
					return (
						<motion.div className='group' key={index} variants={cardVariants} whileHover={{ y: -5 }}>
							<Card className='hover:border-primary/30 bg-card h-full border-2 transition-all duration-300 hover:shadow-xl'>
								<CardContent className='p-6 text-center'>
									<motion.div
										className='bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300'
										transition={{ duration: 0.3 }}
										whileHover={{ scale: 1.1, rotate: 5 }}
									>
										<Icon className='text-primary h-8 w-8' />
									</motion.div>

									<h4 className='group-hover:text-primary mb-3 text-lg transition-colors duration-300'>{item.title}</h4>
									<p className='text-muted-foreground mb-4 text-sm'>{item.description}</p>

									<motion.button
										className='text-primary hover:text-primary-hover text-sm transition-colors duration-300'
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										{item.link} →
									</motion.button>
								</CardContent>
							</Card>
						</motion.div>
					)
				})}
			</motion.div>

			{/* Bottom Badge */}
			<motion.div
				className='mt-16 text-center'
				initial={{ opacity: 0, y: 30 }}
				transition={{ delay: 0.6, duration: 0.8 }}
				viewport={{ once: true }}
				whileInView={{ opacity: 1, y: 0 }}
			>
				<div className='from-secondary/10 to-primary/10 border-secondary/20 inline-flex items-center rounded-full border bg-gradient-to-r px-6 py-3'>
					<Shield className='text-secondary mr-2 h-5 w-5' />
					<span className='text-sm'>
						<strong>Privacy Promise:</strong> We don't know who you are, and we like it that way.
					</span>
				</div>
			</motion.div>
		</div>
	</section>
)
