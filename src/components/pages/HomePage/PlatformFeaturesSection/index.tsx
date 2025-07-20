'use client'

import { motion } from 'framer-motion'
import { Shield, Zap, Users, Globe, TrendingUp, CheckCircle, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
	{
		icon: Shield,
		title: 'Enterprise Security',
		description: 'Military-grade encryption and multi-signature support for maximum asset protection.',
		benefits: ['Multi-signature wallets', 'Hardware wallet integration', 'Audit trail for all transactions', 'Smart contract security'],
		gradient: 'from-primary to-primary-active',
	},
	{
		icon: Zap,
		title: 'Lightning Fast',
		description: "Built on Solana's high-performance blockchain for instant transactions.",
		benefits: ['Sub-second transaction times', 'Low network fees', 'Batch transaction optimization', 'Real-time updates'],
		gradient: 'from-secondary to-green-400',
	},
	{
		icon: Users,
		title: 'Collaborative Control',
		description: 'Team-based management with granular permission controls and governance.',
		benefits: ['Role-based access control', 'Multi-user approval workflows', 'Team activity monitoring', 'Governance token integration'],
		gradient: 'from-purple-500 to-pink-500',
	},
	{
		icon: Globe,
		title: 'Global Accessibility',
		description: 'Access your tools from anywhere with our responsive, web-based platform.',
		benefits: ['Cross-platform compatibility', 'Mobile-optimized interface', 'Offline transaction signing', '24/7 availability'],
		gradient: 'from-blue-500 to-cyan-400',
	},
]

const stats = [
	{ label: 'Uptime Guarantee', value: '99.9%', icon: TrendingUp },
	{ label: 'Security Audits', value: '5+', icon: Shield },
	{ label: 'Supported Tokens', value: '10K+', icon: Star },
	{ label: 'Global Users', value: '25K+', icon: Globe },
]

export const PlatformFeatures = (): React.ReactNode => (
	<section className='from-muted/30 to-background bg-gradient-to-br px-6 py-20'>
		<div className='container mx-auto max-w-7xl'>
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
					<Star className='mr-2 h-4 w-4' />
					<span className='text-sm'>Why Choose Crypto Forge</span>
				</motion.div>

				<h2 className='mb-6 text-3xl md:text-5xl'>Built for Scale, Security &amp; Speed</h2>
				<p className='text-muted-foreground mx-auto max-w-3xl text-xl'>
					Our platform combines cutting-edge technology with intuitive design to deliver the most comprehensive Solana token management
					experience.
				</p>
			</motion.div>

			{/* Features Grid */}
			<div className='mb-20 grid grid-cols-1 gap-8 lg:grid-cols-2'>
				{features.map((feature, index) => {
					const Icon = feature.icon
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
									{/* Icon with gradient background */}
									<motion.div
										className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl`}
										transition={{ duration: 0.3 }}
										whileHover={{ scale: 1.1, rotate: 5 }}
									>
										<Icon className='h-8 w-8 text-white' />
									</motion.div>

									{/* Content */}
									<h3 className='group-hover:text-primary mb-4 text-2xl transition-colors duration-300'>{feature.title}</h3>
									<p className='text-muted-foreground mb-6 leading-relaxed'>{feature.description}</p>

									{/* Benefits List */}
									<div className='space-y-3'>
										{feature.benefits.map((benefit, benefitIndex) => (
											<motion.div
												className='flex items-center'
												initial={{ opacity: 0, x: -20 }}
												key={benefitIndex}
												transition={{ delay: index * 0.1 + benefitIndex * 0.05, duration: 0.4 }}
												viewport={{ once: true }}
												whileInView={{ opacity: 1, x: 0 }}
											>
												<CheckCircle className='text-secondary mr-3 h-5 w-5 flex-shrink-0' />
												<span className='text-muted-foreground text-sm'>{benefit}</span>
											</motion.div>
										))}
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)
				})}
			</div>

			{/* Stats Section */}
			<motion.div
				className='bg-card border-border rounded-2xl border-2 p-8 shadow-lg'
				initial={{ opacity: 0, y: 30 }}
				transition={{ delay: 0.3, duration: 0.8 }}
				viewport={{ once: true }}
				whileInView={{ opacity: 1, y: 0 }}
			>
				<div className='grid grid-cols-2 gap-8 lg:grid-cols-4'>
					{stats.map((stat, index) => {
						const Icon = stat.icon
						return (
							<motion.div
								className='group text-center'
								initial={{ opacity: 0, scale: 0.5 }}
								key={index}
								transition={{ delay: 0.1 * index, duration: 0.5 }}
								viewport={{ once: true }}
								whileInView={{ opacity: 1, scale: 1 }}
							>
								<motion.div
									className='bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300'
									whileHover={{ scale: 1.1 }}
								>
									<Icon className='text-primary h-6 w-6' />
								</motion.div>
								<div className='text-primary mb-2 text-3xl'>{stat.value}</div>
								<div className='text-muted-foreground text-sm'>{stat.label}</div>
							</motion.div>
						)
					})}
				</div>
			</motion.div>

			{/* Timeline Section */}
			<motion.div
				className='mt-20'
				initial={{ opacity: 0, y: 30 }}
				transition={{ delay: 0.5, duration: 0.8 }}
				viewport={{ once: true }}
				whileInView={{ opacity: 1, y: 0 }}
			>
				<h3 className='mb-12 text-center text-2xl md:text-3xl'>Your Token Journey, Simplified</h3>

				<div className='mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3'>
					{[
						{
							step: '01',
							title: 'Connect & Create',
							description: 'Connect your wallet and create tokens with custom parameters in minutes.',
						},
						{
							step: '02',
							title: 'Manage & Control',
							description: 'Use our suite of tools to manage supply, liquidity, and token authorities.',
						},
						{
							step: '03',
							title: 'Scale & Grow',
							description: 'Distribute tokens, manage communities, and build your ecosystem at scale.',
						},
					].map((item, index) => (
						<motion.div
							className='text-center'
							initial={{ opacity: 0, y: 30 }}
							key={index}
							transition={{ delay: 0.2 * index, duration: 0.6 }}
							viewport={{ once: true }}
							whileInView={{ opacity: 1, y: 0 }}
						>
							<div className='from-primary to-primary-active mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-xl text-white'>
								{item.step}
							</div>
							<h4 className='mb-3 text-xl'>{item.title}</h4>
							<p className='text-muted-foreground'>{item.description}</p>
						</motion.div>
					))}
				</div>
			</motion.div>
		</div>
	</section>
)
