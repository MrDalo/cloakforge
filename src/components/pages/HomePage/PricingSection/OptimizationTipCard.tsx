'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import type { OptimizationTip } from './pricingData'

interface OptimizationTipCardProps {
	tip: OptimizationTip
	index: number
}

export const OptimizationTipCard = ({ tip, index }: OptimizationTipCardProps): React.ReactNode => {
	const Icon = tip.icon

	return (
		<motion.div
			className='group'
			initial={{ opacity: 0, y: 20 }}
			transition={{ delay: 0.1 * index, duration: 0.6 }}
			viewport={{ once: true }}
			whileHover={{ y: -5 }}
			whileInView={{ opacity: 1, y: 0 }}
		>
			<Card className='hover:border-secondary/30 bg-card h-full border-2 transition-all duration-300 hover:shadow-xl'>
				<CardContent className='p-6 text-center'>
					<motion.div
						className='bg-secondary/10 group-hover:bg-secondary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300'
						transition={{ duration: 0.3 }}
						whileHover={{ scale: 1.1, rotate: 5 }}
					>
						<Icon className='text-secondary h-8 w-8' />
					</motion.div>

					<h4 className='group-hover:text-secondary mb-3 text-lg transition-colors duration-300'>{tip.tip}</h4>
					<p className='text-muted-foreground text-sm'>{tip.description}</p>
				</CardContent>
			</Card>
		</motion.div>
	)
}
