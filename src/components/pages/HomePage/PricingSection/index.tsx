'use client'

import { motion } from 'framer-motion'
import { Check, Star, Zap, Crown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const pricingPlans = [
	{
		name: 'Free Tier',
		description: 'Perfect for getting started with basic token operations',
		price: 'Free',
		period: 'forever',
		icon: Star,
		features: [
			'Create up to 5 tokens',
			'Basic token burning',
			'Standard transaction speeds',
			'Community support',
			'Basic documentation access',
			'Web interface access',
		],
		limitations: ['Limited to 100 transactions/month', 'Standard network fees apply', 'No priority support'],
		buttonText: 'Get Started Free',
		buttonVariant: 'outline' as const,
		popular: false,
	},
	{
		name: 'Pro',
		description: 'Advanced features for serious token creators and managers',
		price: '$49',
		period: 'per month',
		icon: Zap,
		features: [
			'Unlimited token creation',
			'Advanced liquidity management',
			'Batch transactions & multisender',
			'Priority transaction processing',
			'Authority management tools',
			'Advanced analytics dashboard',
			'Priority email support',
			'API access',
			'Custom token metadata',
			'Freeze/unfreeze capabilities',
		],
		limitations: [],
		buttonText: 'Start Pro Trial',
		buttonVariant: 'default' as const,
		popular: true,
		savings: 'Most Popular',
	},
	{
		name: 'Enterprise',
		description: 'Custom solutions for large organizations and institutions',
		price: 'Custom',
		period: 'contact sales',
		icon: Crown,
		features: [
			'Everything in Pro',
			'Dedicated account manager',
			'Custom integrations',
			'White-label solutions',
			'Advanced security features',
			'Multi-signature support',
			'Compliance reporting',
			'SLA guarantees',
			'24/7 phone support',
			'Custom development',
			'On-premise deployment options',
		],
		limitations: [],
		buttonText: 'Contact Sales',
		buttonVariant: 'outline' as const,
		popular: false,
	},
]

const additionalFees = [
	{
		service: 'Token Creation',
		free: 'Standard SOL fees',
		pro: 'Standard SOL fees',
		enterprise: 'Standard SOL fees',
	},
	{
		service: 'Liquidity Operations',
		free: 'Network fees + DEX fees',
		pro: 'Network fees + DEX fees',
		enterprise: 'Network fees + DEX fees',
	},
	{
		service: 'Transaction Processing',
		free: 'Standard network fees',
		pro: 'Priority processing included',
		enterprise: 'Priority + custom routing',
	},
]

export const PricingSection = (): React.ReactNode => (
	<section className='bg-background px-6 py-20'>
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
					<Crown className='mr-2 h-4 w-4' />
					<span className='text-sm'>Transparent Pricing</span>
				</motion.div>

				<h2 className='mb-6 text-3xl md:text-5xl'>Choose Your Plan</h2>
				<p className='text-muted-foreground mx-auto max-w-3xl text-xl'>
					Start free and scale with your needs. All plans include core Solana token management features with transparent, network-based
					pricing.
				</p>
			</motion.div>

			{/* Pricing Cards */}
			<div className='mb-16 grid grid-cols-1 gap-8 lg:grid-cols-3'>
				{pricingPlans.map((plan, index) => {
					const Icon = plan.icon
					return (
						<motion.div
							className={`group relative ${plan.popular ? 'lg:scale-105' : ''}`}
							initial={{ opacity: 0, y: 50 }}
							key={index}
							transition={{ delay: index * 0.1, duration: 0.6 }}
							viewport={{ once: true }}
							whileHover={{ y: -8 }}
							whileInView={{ opacity: 1, y: 0 }}
						>
							{plan.popular && (
								<motion.div
									className='absolute -top-4 left-1/2 z-10 -translate-x-1/2 transform'
									initial={{ opacity: 0, scale: 0 }}
									transition={{ delay: 0.3, duration: 0.5 }}
									viewport={{ once: true }}
									whileInView={{ opacity: 1, scale: 1 }}
								>
									<Badge className='bg-primary text-primary-foreground px-4 py-1'>{plan.savings}</Badge>
								</motion.div>
							)}

							<Card
								className={`h-full transition-all duration-300 ${
									plan.popular
										? 'border-primary from-card to-primary/5 bg-gradient-to-b shadow-xl'
										: 'hover:border-primary/30 bg-card border-2 hover:shadow-xl'
								}`}
							>
								<CardContent className='p-8'>
									{/* Header */}
									<div className='mb-8 text-center'>
										<motion.div
											className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
												plan.popular ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground'
											}`}
											transition={{ duration: 0.3 }}
											whileHover={{ scale: 1.1, rotate: 5 }}
										>
											<Icon className='h-8 w-8' />
										</motion.div>

										<h3 className='mb-2 text-2xl'>{plan.name}</h3>
										<p className='text-muted-foreground mb-4 text-sm'>{plan.description}</p>

										<div className='mb-6'>
											<div className='flex items-baseline justify-center'>
												<span className='text-4xl'>{plan.price}</span>
												{plan.period && <span className='text-muted-foreground ml-2'>/{plan.period}</span>}
											</div>
										</div>

										<Button
											className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg' : ''}`}
											size='lg'
											variant={plan.buttonVariant}
										>
											{plan.buttonText}
										</Button>
									</div>

									{/* Features */}
									<div className='space-y-4'>
										<h4 className='text-muted-foreground text-sm tracking-wide uppercase'>What's Included</h4>
										<div className='space-y-3'>
											{plan.features.map((feature, featureIndex) => (
												<motion.div
													className='flex items-start'
													initial={{ opacity: 0, x: -20 }}
													key={featureIndex}
													transition={{ delay: index * 0.1 + featureIndex * 0.02, duration: 0.4 }}
													viewport={{ once: true }}
													whileInView={{ opacity: 1, x: 0 }}
												>
													<Check className='text-secondary mt-0.5 mr-3 h-5 w-5 flex-shrink-0' />
													<span className='text-sm'>{feature}</span>
												</motion.div>
											))}
										</div>

										{plan.limitations.length > 0 && (
											<div className='border-border border-t pt-4'>
												<h4 className='text-muted-foreground mb-3 text-sm tracking-wide uppercase'>Limitations</h4>
												<div className='space-y-2'>
													{plan.limitations.map((limitation, limitIndex) => (
														<div className='flex items-start' key={limitIndex}>
															<div className='bg-muted-foreground mt-2 mr-3 h-1.5 w-1.5 flex-shrink-0 rounded-full' />
															<span className='text-muted-foreground text-sm'>{limitation}</span>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)
				})}
			</div>

			{/* Network Fees Table */}
			<motion.div
				className='mx-auto max-w-4xl'
				initial={{ opacity: 0, y: 30 }}
				transition={{ delay: 0.5, duration: 0.8 }}
				viewport={{ once: true }}
				whileInView={{ opacity: 1, y: 0 }}
			>
				<Card className='border-2'>
					<CardContent className='p-8'>
						<h3 className='mb-6 text-center text-2xl'>Network Fees &amp; Costs</h3>
						<div className='overflow-x-auto'>
							<table className='w-full'>
								<thead>
									<tr className='border-border border-b'>
										<th className='px-4 py-4 text-left'>Service</th>
										<th className='px-4 py-4 text-center'>Free Tier</th>
										<th className='px-4 py-4 text-center'>Pro</th>
										<th className='px-4 py-4 text-center'>Enterprise</th>
									</tr>
								</thead>
								<tbody>
									{additionalFees.map((fee, index) => (
										<motion.tr
											className='border-border/50 border-b'
											initial={{ opacity: 0, x: -20 }}
											key={index}
											transition={{ delay: 0.1 * index, duration: 0.4 }}
											viewport={{ once: true }}
											whileInView={{ opacity: 1, x: 0 }}
										>
											<td className='px-4 py-4'>{fee.service}</td>
											<td className='text-muted-foreground px-4 py-4 text-center text-sm'>{fee.free}</td>
											<td className='text-muted-foreground px-4 py-4 text-center text-sm'>{fee.pro}</td>
											<td className='text-muted-foreground px-4 py-4 text-center text-sm'>{fee.enterprise}</td>
										</motion.tr>
									))}
								</tbody>
							</table>
						</div>
						<p className='text-muted-foreground mt-6 text-center text-sm'>
							All Solana network fees are paid directly to the network. Crypto Forge only charges subscription fees where applicable.
						</p>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	</section>
)
