'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap, Lock, Coins, Droplets, Flame } from 'lucide-react'
import cryptoForgeLogo from 'figma:asset/88a6e8d5becbf86195fdc075227a6fb6a8939fc9.png'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export const HeroSection = (): React.ReactNode => (
	<section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-20'>
		{/* Background Elements */}
		<div className='absolute inset-0 overflow-hidden'>
			{/* Subtle crypto elements */}
			<motion.div
				animate={{
					x: [0, 100, 0],
					y: [0, -50, 0],
					rotate: [0, 180, 360],
				}}
				className='border-primary/20 absolute top-20 left-20 flex h-20 w-20 items-center justify-center rounded-full border-2'
				transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
			>
				<Coins className='text-primary/40 h-8 w-8' />
			</motion.div>

			<motion.div
				animate={{
					x: [0, -80, 0],
					y: [0, 100, 0],
					rotate: [0, -180, -360],
				}}
				className='bg-secondary/10 border-secondary/20 absolute top-40 right-32 flex h-16 w-16 items-center justify-center rounded-lg border'
				transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
			>
				<Droplets className='text-secondary/40 h-8 w-8' />
			</motion.div>

			<motion.div
				animate={{
					scale: [1, 1.2, 1],
					opacity: [0.3, 0.6, 0.3],
				}}
				className='bg-primary/10 absolute bottom-20 left-1/4 h-32 w-32 rounded-full blur-xl'
				transition={{ duration: 4, repeat: Infinity }}
			/>
		</div>

		<div className='relative z-10 container mx-auto max-w-6xl'>
			<div className='grid items-center gap-12 lg:grid-cols-2'>
				{/* Content */}
				<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 50 }} transition={{ duration: 0.8 }}>
					{/* Clean Badge */}
					<motion.div
						animate={{ opacity: 1, scale: 1 }}
						className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
						initial={{ opacity: 0, scale: 0 }}
						transition={{ delay: 0.2, duration: 0.5 }}
					>
						<Zap className='mr-2 h-4 w-4' />
						<span className='text-sm'>Fast • Secure • Decentralized</span>
					</motion.div>

					{/* Main Headline */}
					<motion.h1
						animate={{ opacity: 1, y: 0 }}
						className='mb-6 text-4xl leading-tight md:text-6xl lg:text-7xl'
						initial={{ opacity: 0, y: 20 }}
						transition={{ delay: 0.3, duration: 0.8 }}
					>
						<span className='from-foreground to-muted-foreground bg-gradient-to-r bg-clip-text text-transparent'>Forge, Manage &</span>
						<br />
						<span className='crypto-text-gradient'>Control Solana Assets</span>
						<br />
						<span className='from-foreground to-muted-foreground bg-gradient-to-r bg-clip-text text-transparent'>Like a Pro</span>
					</motion.h1>

					{/* Subtitle */}
					<motion.p
						animate={{ opacity: 1, y: 0 }}
						className='text-muted-foreground mb-8 text-lg leading-relaxed md:text-xl'
						initial={{ opacity: 0, y: 20 }}
						transition={{ delay: 0.4, duration: 0.8 }}
					>
						Your all-in-one Solana token utility suite — fast, secure, and open. Create tokens, manage liquidity, and control your digital
						assets with professional-grade tools.
					</motion.p>

					{/* Key Features */}
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className='mb-8 grid grid-cols-2 gap-4'
						initial={{ opacity: 0, y: 20 }}
						transition={{ delay: 0.5, duration: 0.8 }}
					>
						{[
							{ icon: Zap, text: 'Lightning Fast' },
							{ icon: Shield, text: 'Secure & Private' },
							{ icon: Lock, text: 'Self-Custody' },
							{ icon: Coins, text: 'Professional Tools' },
						].map((feature, index) => {
							const Icon = feature.icon
							return (
								<motion.div
									animate={{ opacity: 1, x: 0 }}
									className='flex items-center space-x-3'
									initial={{ opacity: 0, x: -20 }}
									key={index}
									transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
								>
									<div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg'>
										<Icon className='text-primary h-4 w-4' />
									</div>
									<span className='text-muted-foreground text-sm'>{feature.text}</span>
								</motion.div>
							)
						})}
					</motion.div>

					{/* CTA Buttons */}
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className='flex flex-col gap-4 sm:flex-row'
						initial={{ opacity: 0, y: 20 }}
						transition={{ delay: 0.7, duration: 0.8 }}
					>
						<Button
							className='bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl px-8 py-3 shadow-lg transition-all duration-300 hover:shadow-xl'
							size='lg'
						>
							Launch App
							<ArrowRight className='ml-2 h-5 w-5' />
						</Button>
						<Button className='hover:bg-accent rounded-xl border-2 px-8 py-3 transition-all duration-300' size='lg' variant='outline'>
							View Docs
						</Button>
					</motion.div>

					{/* Trust Indicators */}
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className='border-border mt-12 grid grid-cols-3 gap-6 border-t pt-8'
						initial={{ opacity: 0, y: 20 }}
						transition={{ delay: 0.8, duration: 0.8 }}
					>
						{[
							{ label: 'Active Users', value: '25K+' },
							{ label: 'Transactions', value: '500K+' },
							{ label: 'Tools Available', value: '7+' },
						].map((stat, index) => (
							<div className='text-center' key={index}>
								<div className='crypto-text-gradient mb-1 text-2xl md:text-3xl'>{stat.value}</div>
								<div className='text-muted-foreground text-sm'>{stat.label}</div>
							</div>
						))}
					</motion.div>
				</motion.div>

				{/* Visual Elements */}
				<motion.div
					animate={{ opacity: 1, scale: 1 }}
					className='relative'
					initial={{ opacity: 0, scale: 0.8 }}
					transition={{ delay: 0.4, duration: 1 }}
				>
					<div className='relative mx-auto w-full max-w-lg'>
						{/* Central Orbit */}
						<motion.div
							animate={{ rotate: 360 }}
							className='border-primary/30 relative mx-auto h-80 w-80 rounded-full border-4'
							transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
						>
							{/* Orbiting Tools */}
							{[
								{ icon: Coins, color: 'bg-primary', delay: 0, label: 'Create' },
								{ icon: Droplets, color: 'bg-secondary', delay: 2, label: 'Manage' },
								{ icon: Flame, color: 'bg-warning', delay: 4, label: 'Control' },
							].map((item, index) => {
								const Icon = item.icon
								return (
									<motion.div
										animate={{ rotate: -360 }}
										className='absolute -top-8 left-1/2 -ml-8 h-16 w-16'
										key={index}
										style={{
											transformOrigin: '50% 168px',
										}}
										transition={{
											duration: 30,
											repeat: Infinity,
											ease: 'linear',
											delay: item.delay,
										}}
									>
										<motion.div
											className={`h-full w-full rounded-full ${item.color} float-animation group flex items-center justify-center shadow-lg`}
											whileHover={{ scale: 1.1 }}
										>
											<Icon className='h-8 w-8 text-white' />
											<div className='absolute -bottom-8 left-1/2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100'>
												<div className='bg-card text-card-foreground rounded px-2 py-1 text-xs shadow-lg'>{item.label}</div>
											</div>
										</motion.div>
									</motion.div>
								)
							})}
						</motion.div>

						{/* Center Logo */}
						<motion.div
							animate={{
								scale: [1, 1.1, 1],
								rotate: [0, 5, -5, 0],
							}}
							className='absolute inset-0 flex items-center justify-center'
							transition={{ duration: 4, repeat: Infinity }}
						>
							<div className='relative size-20 overflow-hidden rounded-2xl shadow-2xl'>
								<Image alt='Crypto Forge' className='h-full w-full rounded-2xl object-cover' fill src='/CryptoForge-logo.webp' />
							</div>
						</motion.div>
					</div>
				</motion.div>
			</div>
		</div>
	</section>
)
