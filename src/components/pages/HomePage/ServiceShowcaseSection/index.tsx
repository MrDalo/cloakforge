'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Coins, Droplets, Flame, Shield, Lock, UserX, Send, ArrowRight, Zap } from 'lucide-react'

const services = [
	{
		id: 'token-creator',
		title: 'Token Creator',
		description: 'Launch professional SPL tokens with custom metadata, supply controls, and advanced features.',
		icon: Coins,
		color: 'primary',
		features: ['Custom Metadata', 'Supply Control', 'Advanced Features'],
		highlight: 'Most Popular',
	},
	{
		id: 'create-liquidity',
		title: 'Create Liquidity',
		description: 'Add liquidity to DEXs and create trading pairs with optimized routing and minimal slippage.',
		icon: Droplets,
		color: 'secondary',
		features: ['DEX Integration', 'Optimal Routing', 'Minimal Slippage'],
		highlight: 'Fast & Efficient',
	},
	{
		id: 'burn-tokens',
		title: 'Burn Tokens',
		description: 'Permanently remove tokens from circulation with batch operations and detailed reporting.',
		icon: Flame,
		color: 'destructive',
		features: ['Batch Operations', 'Detailed Reports', 'Permanent Removal'],
		highlight: 'Batch Support',
	},
	{
		id: 'revoke-mint',
		title: 'Revoke Mint Authority',
		description: 'Permanently disable token minting to build trust and ensure fixed supply for your community.',
		icon: Shield,
		color: 'primary',
		features: ['Trust Building', 'Fixed Supply', 'Community Benefits'],
		highlight: 'Build Trust',
	},
	{
		id: 'revoke-freeze',
		title: 'Revoke Freeze Authority',
		description: 'Remove freeze capabilities to ensure complete decentralization and token freedom.',
		icon: Lock,
		color: 'secondary',
		features: ['Full Decentralization', 'Token Freedom', 'Community Control'],
		highlight: 'Decentralized',
	},
	{
		id: 'freeze-accounts',
		title: 'Freeze Accounts',
		description: 'Temporarily disable token accounts for compliance and security with reversible controls.',
		icon: UserX,
		color: 'warning',
		features: ['Compliance Tools', 'Reversible Actions', 'Security Features'],
		highlight: 'Compliance Ready',
	},
	{
		id: 'multisender',
		title: 'Transaction Multisender',
		description: 'Send tokens to multiple addresses simultaneously with optimized batching and cost reduction.',
		icon: Send,
		color: 'info',
		features: ['Batch Optimization', 'Cost Reduction', 'Mass Distribution'],
		highlight: 'Save on Fees',
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
			ease: 'easeInOut',
		},
	},
}

export const ServiceShowcase = (): React.ReactNode => (
	<section className='bg-background relative overflow-hidden px-6 py-20'>
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
					<Zap className='mr-2 h-4 w-4' />
					<span className='text-sm'>Professional Tools</span>
				</motion.div>

				<h2 className='from-foreground to-muted-foreground mb-6 bg-gradient-to-r bg-clip-text text-3xl text-transparent md:text-5xl'>
					Complete Solana Token Management Suite
				</h2>
				<p className='text-muted-foreground mx-auto max-w-3xl text-xl'>
					Everything you need to create, manage, and control your Solana tokens. Professional-grade tools built for developers, creators,
					and projects.
				</p>
			</motion.div>

			{/* Services Grid */}
			<motion.div
				className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'
				initial='hidden'
				variants={containerVariants}
				viewport={{ once: true }}
				whileInView='visible'
			>
				{services.map((service) => {
					const Icon = service.icon
					return (
						<motion.div
							className='group'
							key={service.id}
							variants={cardVariants}
							whileHover={{
								y: -8,
								transition: { duration: 0.3 },
							}}
						>
							<Card className='hover:border-primary/30 bg-card h-full border-2 transition-all duration-300 hover:shadow-xl'>
								<CardContent className='p-6'>
									{/* Header with Badge */}
									<div className='mb-4 flex items-start justify-between'>
										<motion.div
											className={`h-14 w-14 rounded-xl ${
												service.color === 'primary'
													? 'from-primary to-primary bg-gradient-to-br'
													: service.color === 'secondary'
														? 'from-secondary to-secondary bg-gradient-to-br'
														: service.color === 'destructive'
															? 'from-destructive to-destructive bg-gradient-to-br'
															: service.color === 'warning'
																? 'from-warning to-warning bg-gradient-to-br'
																: 'from-info to-info bg-gradient-to-br'
											} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl`}
											transition={{ duration: 0.3 }}
											whileHover={{ scale: 1.1, rotate: 5 }}
										>
											<Icon className='h-7 w-7 text-white' />
										</motion.div>

										<div className='bg-secondary/10 text-secondary rounded-full px-2 py-1 text-xs'>{service.highlight}</div>
									</div>

									{/* Content */}
									<h3 className='group-hover:text-primary mb-3 text-xl transition-colors duration-300'>{service.title}</h3>
									<p className='text-muted-foreground mb-4 leading-relaxed'>{service.description}</p>

									{/* Features */}
									<div className='mb-6 space-y-2'>
										{service.features.map((feature, index) => (
											<div className='text-muted-foreground flex items-center text-sm' key={index}>
												<div className='bg-primary mr-2 h-1.5 w-1.5 rounded-full' />
												{feature}
											</div>
										))}
									</div>

									{/* Action */}
									<motion.div
										className='text-primary group-hover:text-primary-hover flex cursor-pointer items-center transition-colors duration-300'
										whileHover={{ x: 5 }}
									>
										<span className='text-sm'>Use Tool</span>
										<ArrowRight className='ml-2 h-4 w-4' />
									</motion.div>
								</CardContent>
							</Card>
						</motion.div>
					)
				})}
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
					<Coins className='text-primary mx-auto mb-4 h-12 w-12' />
					<h4 className='mb-4 text-xl'>Ready to Start Building?</h4>
					<p className='text-muted-foreground mb-6'>All tools are fully on-chain and work directly with your wallet. No setup required.</p>
					<motion.button
						className='bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl px-8 py-3 shadow-lg transition-all duration-300 hover:shadow-xl'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						Launch Application
					</motion.button>
				</div>
			</motion.div>
		</div>
	</section>
)
