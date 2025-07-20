'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Shield, Zap, Lock, Globe, CheckCircle, Key } from 'lucide-react'

const benefits = [
	{
		icon: Shield,
		title: 'Self-Sovereign Control',
		description: 'Maintain full control over your assets and transactions without intermediaries.',
		details: ['Direct wallet interaction', 'No third-party custody', 'Full transaction control'],
		color: 'primary',
	},
	{
		icon: Zap,
		title: 'No Registration Required',
		description: 'Start using our tools immediately with just your wallet — no lengthy onboarding.',
		details: ['Instant access with wallet', 'No account verification', 'Start building right away'],
		color: 'secondary',
	},
	{
		icon: Globe,
		title: 'Global Accessibility',
		description: 'Access professional-grade tools from anywhere in the world, anytime.',
		details: ['No geographic restrictions', 'Works globally 24/7', 'Permissionless access'],
		color: 'primary',
	},
	{
		icon: Lock,
		title: 'Privacy by Design',
		description: "Built with privacy-first principles — we don't collect unnecessary data.",
		details: ['Minimal data collection', 'On-chain transactions only', 'No behavioral tracking'],
		color: 'secondary',
	},
]

const comparisonData = [
	{
		feature: 'Getting Started',
		traditional: 'Account setup & KYC',
		cryptoForge: 'Connect wallet',
		benefit: 'Instant access',
	},
	{
		feature: 'Data Requirements',
		traditional: 'Personal information',
		cryptoForge: 'Wallet address only',
		benefit: 'Privacy protection',
	},
	{
		feature: 'Access Control',
		traditional: 'Platform dependent',
		cryptoForge: 'Self-sovereign',
		benefit: 'True ownership',
	},
	{
		feature: 'Transaction Fees',
		traditional: 'Platform + network',
		cryptoForge: 'Network only',
		benefit: 'Lower costs',
	},
]

export const WhyAnonymousSection = (): React.ReactNode => (
	<section className='from-background to-muted/30 relative overflow-hidden bg-gradient-to-br px-6 py-20'>
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
					className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
					initial={{ opacity: 0, scale: 0 }}
					transition={{ delay: 0.2, duration: 0.5 }}
					viewport={{ once: true }}
					whileInView={{ opacity: 1, scale: 1 }}
				>
					<Key className='mr-2 h-4 w-4' />
					<span className='text-sm'>Web3 Advantages</span>
				</motion.div>

				<h2 className='mb-6 text-3xl md:text-5xl'>Why Choose Crypto Forge?</h2>
				<p className='text-muted-foreground mx-auto max-w-3xl text-xl'>
					Experience the benefits of true Web3 development: instant access, full control, and privacy-respecting tools that work the way you
					expect.
				</p>
			</motion.div>

			{/* Benefits Grid */}
			<div className='mb-20 grid grid-cols-1 gap-8 md:grid-cols-2'>
				{benefits.map((benefit, index) => {
					const Icon = benefit.icon
					return (
						<motion.div
							className='group'
							initial={{ opacity: 0, y: 50 }}
							key={index}
							transition={{ delay: index * 0.1, duration: 0.6 }}
							viewport={{ once: true }}
							whileHover={{ y: -5 }}
							whileInView={{ opacity: 1, y: 0 }}
						>
							<Card className='hover:border-primary/30 bg-card h-full border-2 transition-all duration-300 hover:shadow-xl'>
								<CardContent className='p-8'>
									{/* Icon */}
									<motion.div
										className={`h-16 w-16 rounded-2xl bg-${benefit.color}/10 mb-6 flex items-center justify-center group-hover:bg-${benefit.color}/20 transition-all duration-300`}
										transition={{ duration: 0.3 }}
										whileHover={{ scale: 1.1, rotate: 5 }}
									>
										<Icon className={`h-8 w-8 text-${benefit.color}`} />
									</motion.div>

									{/* Content */}
									<h3 className='group-hover:text-primary mb-4 text-2xl transition-colors duration-300'>{benefit.title}</h3>
									<p className='text-muted-foreground mb-6 leading-relaxed'>{benefit.description}</p>

									{/* Details List */}
									<div className='space-y-3'>
										{benefit.details.map((detail, detailIndex) => (
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
			</div>

			{/* Comparison Table */}
			<motion.div
				className='mx-auto max-w-4xl'
				initial={{ opacity: 0, y: 30 }}
				transition={{ delay: 0.3, duration: 0.8 }}
				viewport={{ once: true }}
				whileInView={{ opacity: 1, y: 0 }}
			>
				<Card className='border-border bg-card border-2 shadow-xl'>
					<CardContent className='p-8'>
						<h3 className='mb-8 text-center text-2xl md:text-3xl'>Traditional vs. Web3 Approach</h3>

						<div className='overflow-x-auto'>
							<table className='w-full'>
								<thead>
									<tr className='border-border border-b-2'>
										<th className='px-4 py-4 text-left' />
										<th className='text-muted-foreground px-4 py-4 text-center'>Traditional</th>
										<th className='text-primary px-4 py-4 text-center'>Crypto Forge</th>
										<th className='text-secondary px-4 py-4 text-center'>Benefit</th>
									</tr>
								</thead>
								<tbody>
									{comparisonData.map((row, index) => (
										<motion.tr
											className='border-border/50 hover:bg-muted/20 border-b transition-colors duration-300'
											initial={{ opacity: 0, x: -20 }}
											key={index}
											transition={{ delay: 0.1 * index, duration: 0.4 }}
											viewport={{ once: true }}
											whileInView={{ opacity: 1, x: 0 }}
										>
											<td className='px-4 py-4 font-medium'>{row.feature}</td>
											<td className='text-muted-foreground px-4 py-4 text-center text-sm'>{row.traditional}</td>
											<td className='text-primary px-4 py-4 text-center text-sm'>{row.cryptoForge}</td>
											<td className='text-secondary px-4 py-4 text-center text-sm'>{row.benefit}</td>
										</motion.tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Bottom CTA */}
			<motion.div
				className='mt-16 text-center'
				initial={{ opacity: 0, y: 30 }}
				transition={{ delay: 0.5, duration: 0.8 }}
				viewport={{ once: true }}
				whileInView={{ opacity: 1, y: 0 }}
			>
				<div className='from-primary/10 to-secondary/10 rounded-2xl bg-gradient-to-r p-8'>
					<Zap className='text-primary mx-auto mb-4 h-12 w-12' />
					<h4 className='mb-4 text-xl'>Ready to Experience Web3 Freedom?</h4>
					<p className='text-muted-foreground mb-6'>Join the movement toward truly decentralized, user-controlled financial tools.</p>
					<motion.button
						className='bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl px-8 py-3 shadow-lg transition-all duration-300 hover:shadow-xl'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						Connect Your Wallet
					</motion.button>
				</div>
			</motion.div>
		</div>
	</section>
)
