'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import type { FeeComponent } from './pricingData'

interface FeeBreakdownCardProps {
	item: FeeComponent
	index: number
}

export const FeeBreakdownCard = ({ item, index }: FeeBreakdownCardProps): React.ReactNode => {
	const Icon = item.icon

	return (
		<motion.div
			className='group'
			initial={{ opacity: 0, y: 20 }}
			transition={{ delay: 0.1 * index, duration: 0.6 }}
			viewport={{ once: true }}
			whileHover={{ y: -5 }}
			whileInView={{ opacity: 1, y: 0 }}
		>
			<Card className='hover:border-primary/30 bg-card h-full border-2 transition-all duration-300 hover:shadow-xl'>
				<CardContent className='p-6'>
					<div className='mb-4 flex items-center space-x-4'>
						<motion.div
							className={`h-12 w-12 rounded-xl ${item.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'} flex items-center justify-center ${item.color === 'primary' ? 'group-hover:bg-primary/20' : 'group-hover:bg-secondary/20'} transition-all duration-300`}
							transition={{ duration: 0.3 }}
							whileHover={{ scale: 1.1, rotate: 5 }}
						>
							<Icon className={`h-6 w-6 ${item.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
						</motion.div>
						<div>
							<h3 className='group-hover:text-primary text-lg transition-colors duration-300'>{item.component}</h3>
							<p className='text-muted-foreground text-sm'>{item.description}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	)
}
