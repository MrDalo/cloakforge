'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export const SectionHeader = (): React.ReactNode => (
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
			Everything you need to create, manage, and control your Solana tokens. Professional-grade tools built for developers, creators, and
			projects.
		</p>
	</motion.div>
)
