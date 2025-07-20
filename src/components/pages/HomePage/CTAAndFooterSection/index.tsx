'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Github, Twitter, MessageCircle, Globe, Zap, Coins, Database, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import cryptoForgeLogo from 'figma:asset/88a6e8d5becbf86195fdc075227a6fb6a8939fc9.png'
import cryptoForgeIcon from 'figma:asset/0dea28e8a50b85b237308ba54d0409f1845a62aa.png'
import Image from 'next/image'

const footerLinks = {
	product: [
		{ name: 'Token Creator', href: '/token-creator' },
		{ name: 'Liquidity Tools', href: '/liquidity' },
		{ name: 'Authority Management', href: '/authority' },
		{ name: 'Multisender', href: '/multisender' },
		{ name: 'API Documentation', href: '/docs/api' },
	],
	resources: [
		{ name: 'Documentation', href: '/docs' },
		{ name: 'Tutorials', href: '/tutorials' },
		{ name: 'Blog', href: '/blog' },
		{ name: 'Community', href: '/community' },
		{ name: 'Support Center', href: '/support' },
	],
	company: [
		{ name: 'About Us', href: '/about' },
		{ name: 'Privacy Policy', href: '/privacy' },
		{ name: 'Terms of Service', href: '/terms' },
		{ name: 'Contact', href: '/contact' },
		{ name: 'Status', href: '/status' },
	],
	developers: [
		{ name: 'Open Source', href: '/open-source' },
		{ name: 'GitHub', href: 'https://github.com/cryptoforge' },
		{ name: 'Contribute', href: '/contribute' },
		{ name: 'Bug Reports', href: '/bugs' },
		{ name: 'Feature Requests', href: '/features' },
	],
}

const socialLinks = [
	{ name: 'Twitter', icon: Twitter, href: 'https://twitter.com/cryptoforge' },
	{ name: 'GitHub', icon: Github, href: 'https://github.com/cryptoforge' },
	{ name: 'Discord', icon: MessageCircle, href: 'https://discord.gg/cryptoforge' },
]

const platformFeatures = [
	{ icon: Zap, text: 'Lightning Fast' },
	{ icon: Shield, text: 'Secure' },
	{ icon: Globe, text: 'Global Access' },
	{ icon: Database, text: 'On-Chain' },
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

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
		},
	},
}

export const CTAAndFooter = () => (
	<>
		{/* Call to Action Section */}
		<section className='from-primary/5 via-background to-secondary/5 relative overflow-hidden bg-gradient-to-br px-6 py-20'>
			{/* Background Elements */}
			<div className='absolute inset-0 overflow-hidden'>
				<motion.div
					animate={{
						x: [0, 100, 0],
						y: [0, -50, 0],
						rotate: [0, 360],
					}}
					className='border-primary/20 absolute top-10 left-10 flex h-32 w-32 items-center justify-center rounded-full border'
					transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
				>
					<Coins className='text-primary/30 h-12 w-12' />
				</motion.div>
				<motion.div
					animate={{
						x: [0, -80, 0],
						y: [0, 80, 0],
						rotate: [0, -360],
					}}
					className='bg-secondary/10 absolute right-10 bottom-10 flex h-24 w-24 items-center justify-center rounded-lg'
					transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
				>
					<Zap className='text-secondary/30 h-8 w-8' />
				</motion.div>
			</div>

			<div className='relative z-10 container mx-auto max-w-4xl'>
				<motion.div
					className='text-center'
					initial={{ opacity: 0, y: 50 }}
					transition={{ duration: 0.8 }}
					viewport={{ once: true }}
					whileInView={{ opacity: 1, y: 0 }}
				>
					<motion.div
						className='relative mx-auto mb-8 flex size-20 items-center justify-center overflow-hidden rounded-2xl'
						initial={{ opacity: 0, scale: 0 }}
						transition={{ delay: 0.2, duration: 0.5 }}
						viewport={{ once: true }}
						whileInView={{ opacity: 1, scale: 1 }}
					>
						<Image alt='Crypto Forge' className='h-full w-full object-cover' fill src='/CryptoForge-logo.webp' />
					</motion.div>

					<motion.h2
						className='mb-6 text-3xl md:text-5xl'
						initial={{ opacity: 0, y: 20 }}
						transition={{ delay: 0.3, duration: 0.8 }}
						viewport={{ once: true }}
						whileInView={{ opacity: 1, y: 0 }}
					>
						Ready to Build Something Amazing?
					</motion.h2>

					<motion.p
						className='text-muted-foreground mx-auto mb-8 max-w-3xl text-xl'
						initial={{ opacity: 0, y: 20 }}
						transition={{ delay: 0.4, duration: 0.8 }}
						viewport={{ once: true }}
						whileInView={{ opacity: 1, y: 0 }}
					>
						Join thousands of developers and creators who trust Crypto Forge for their Solana token needs. Professional tools, instant
						access, fair pricing.
					</motion.p>

					{/* Platform Features */}
					<motion.div
						className='mb-8 flex flex-wrap justify-center gap-6'
						initial='hidden'
						variants={containerVariants}
						viewport={{ once: true }}
						whileInView='visible'
					>
						{platformFeatures.map((feature, index) => {
							const Icon = feature.icon
							return (
								<motion.div
									className='bg-card border-border flex items-center space-x-2 rounded-full border px-4 py-2'
									key={index}
									variants={itemVariants}
								>
									<Icon className='text-primary h-4 w-4' />
									<span className='text-muted-foreground text-sm'>{feature.text}</span>
								</motion.div>
							)
						})}
					</motion.div>

					<motion.div
						className='mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row'
						initial={{ opacity: 0, y: 20 }}
						transition={{ delay: 0.7, duration: 0.8 }}
						viewport={{ once: true }}
						whileInView={{ opacity: 1, y: 0 }}
					>
						<Button
							className='bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl px-8 py-4 text-lg shadow-lg transition-all duration-300 hover:shadow-xl'
							size='lg'
						>
							Launch Application
							<ArrowRight className='ml-2 h-5 w-5' />
						</Button>

						<div className='text-muted-foreground flex items-center gap-4 text-sm'>
							<div className='flex items-center'>
								<Shield className='mr-1 h-4 w-4' />
								Secure & reliable
							</div>
							<div className='flex items-center'>
								<Users className='mr-1 h-4 w-4' />
								25K+ users
							</div>
						</div>
					</motion.div>

					{/* Quick Stats */}
					<motion.div
						className='border-border mx-auto grid max-w-2xl grid-cols-3 gap-8 border-t pt-8'
						initial='hidden'
						variants={containerVariants}
						viewport={{ once: true }}
						whileInView='visible'
					>
						{[
							{ label: 'Active Users', value: '25K+' },
							{ label: 'Tokens Created', value: '100K+' },
							{ label: 'Tools Available', value: '7+' },
						].map((stat, index) => (
							<motion.div className='text-center' key={index} variants={itemVariants} whileHover={{ scale: 1.05 }}>
								<div className='crypto-text-gradient mb-2 text-2xl md:text-3xl'>{stat.value}</div>
								<div className='text-muted-foreground text-sm'>{stat.label}</div>
							</motion.div>
						))}
					</motion.div>
				</motion.div>
			</div>
		</section>

		{/* Footer */}
		<footer className='bg-card border-border border-t px-6 py-16'>
			<div className='container mx-auto max-w-7xl'>
				<div className='mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5'>
					{/* Brand Column */}
					<div className='lg:col-span-1'>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							transition={{ duration: 0.6 }}
							viewport={{ once: true }}
							whileInView={{ opacity: 1, y: 0 }}
						>
							<div className='mb-6 flex items-center'>
								<div className='relative mr-3 flex size-10 items-center justify-center overflow-hidden rounded-lg'>
									<Image alt='Crypto Forge' className='h-full w-full object-contain' fill src='/CryptoForge-logo-without-rectangle.webp' />
								</div>
								<span className='text-xl'>Crypto Forge</span>
							</div>
							<p className='text-muted-foreground mb-6 leading-relaxed'>
								Professional Solana token management tools built for developers, creators, and projects.
							</p>

							<div className='flex space-x-4'>
								{socialLinks.map((social) => {
									const Icon = social.icon
									return (
										<motion.a
											className='bg-muted hover:bg-primary hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300'
											href={social.href}
											key={social.name}
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.95 }}
										>
											<Icon className='h-5 w-5' />
										</motion.a>
									)
								})}
							</div>
						</motion.div>
					</div>

					{/* Links Columns */}
					{Object.entries(footerLinks).map(([category, links], index) => (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							key={category}
							transition={{ delay: index * 0.1, duration: 0.6 }}
							viewport={{ once: true }}
							whileInView={{ opacity: 1, y: 0 }}
						>
							<h3 className='text-foreground mb-4 capitalize'>{category}</h3>
							<ul className='space-y-3'>
								{links.map((link) => (
									<li key={link.name}>
										<a className='text-muted-foreground hover:text-primary transition-colors duration-300' href={link.href}>
											{link.name}
										</a>
									</li>
								))}
							</ul>
						</motion.div>
					))}
				</div>

				{/* Bottom Section */}
				<motion.div
					className='border-border border-t pt-8'
					initial={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.4, duration: 0.6 }}
					viewport={{ once: true }}
					whileInView={{ opacity: 1, y: 0 }}
				>
					<div className='flex flex-col items-center justify-between md:flex-row'>
						<div className='mb-4 flex flex-col items-center gap-4 md:mb-0 md:flex-row'>
							<p className='text-muted-foreground text-sm'>© 2025 Crypto Forge. Built for creators.</p>
							<div className='text-muted-foreground flex items-center gap-4 text-sm'>
								<div className='flex items-center'>
									<Shield className='text-primary mr-1 h-4 w-4' />
									Secure & Reliable
								</div>
								<div className='flex items-center'>
									<Globe className='text-secondary mr-1 h-4 w-4' />
									Global Access
								</div>
							</div>
						</div>

						<div className='flex items-center gap-4 text-sm'>
							<span className='text-primary'>Built with ❤️ for the Solana community</span>
						</div>
					</div>
				</motion.div>
			</div>
		</footer>
	</>
)
