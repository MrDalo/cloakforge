'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

export const SectionHeader = (): React.ReactNode => (
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
			Our platform combines cutting-edge technology with intuitive design to deliver the most comprehensive Solana token management experience.
		</p>
	</motion.div>
)
