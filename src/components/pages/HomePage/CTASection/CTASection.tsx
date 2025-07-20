'use client'

import { motion } from 'framer-motion'
import { BackgroundElements } from './BackgroundElements'
import { CTAButtons } from './CTAButtons'
import { CTAHeader } from './CTAHeader'
import { PlatformFeatures } from './PlatformFeatures'
import { QuickStats } from './QuickStats'

export const CTASection = (): React.ReactNode => (
	<section className='from-primary/5 via-background to-secondary/5 relative overflow-hidden bg-gradient-to-br px-6 py-20'>
		<BackgroundElements />

		<div className='relative z-10 container mx-auto max-w-4xl'>
			<motion.div
				className='text-center'
				initial={{ opacity: 0, y: 50 }}
				transition={{ duration: 0.8 }}
				viewport={{ once: true }}
				whileInView={{ opacity: 1, y: 0 }}
			>
				<CTAHeader />
				<PlatformFeatures />
				<CTAButtons />
				<QuickStats />
			</motion.div>
		</div>
	</section>
)
