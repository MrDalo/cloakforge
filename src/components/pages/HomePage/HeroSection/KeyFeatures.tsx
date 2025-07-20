'use client'

import { motion } from 'framer-motion'
import { features } from './heroData'

export const KeyFeatures = (): React.ReactNode => (
	<motion.div
		animate={{ opacity: 1, y: 0 }}
		className='mb-8 grid grid-cols-2 gap-4'
		initial={{ opacity: 0, y: 20 }}
		transition={{ delay: 0.5, duration: 0.8 }}
	>
		{features.map((feature, index) => {
			const Icon = feature.icon
			return (
				<motion.div
					animate={{ opacity: 1, x: 0 }}
					className='flex items-center space-x-3'
					initial={{ opacity: 0, x: -20 }}
					key={index}
					transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
				>
					<div className='bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
						<Icon className='text-primary h-4 w-4' />
					</div>
					<span className='text-muted-foreground text-sm'>{feature.text}</span>
				</motion.div>
			)
		})}
	</motion.div>
)
