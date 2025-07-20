'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import type { Benefit } from './whyCryptoForgeData'

interface BenefitCardProps {
	benefit: Benefit
	index: number
}

export const BenefitCard = ({ benefit, index }: BenefitCardProps): React.ReactNode => {
	const Icon = benefit.icon

	return (
		<motion.div
			className='group'
			initial={{ opacity: 0, y: 50 }}
			transition={{ delay: index * 0.1, duration: 0.6 }}
			viewport={{ once: true }}
			whileHover={{ y: -5 }}
			whileInView={{ opacity: 1, y: 0 }}
		>
			<Card className='hover:border-primary/30 bg-card h-full border-2 transition-all duration-300 hover:shadow-xl'>
				<CardContent className='p-8'>
					<motion.div
						className={`h-16 w-16 rounded-2xl bg-${benefit.color}/10 mb-6 flex items-center justify-center group-hover:bg-${benefit.color}/20 transition-all duration-300`}
						transition={{ duration: 0.3 }}
						whileHover={{ scale: 1.1, rotate: 5 }}
					>
						<Icon className={`h-8 w-8 text-${benefit.color}`} />
					</motion.div>

					<h3 className='group-hover:text-primary mb-4 text-2xl transition-colors duration-300'>{benefit.title}</h3>
					<p className='text-muted-foreground mb-6 leading-relaxed'>{benefit.description}</p>

					<div className='space-y-3'>
						{benefit.details.map((detail, detailIndex) => (
							<motion.div
								className='flex items-center'
								initial={{ opacity: 0, x: -20 }}
								key={detailIndex}
								transition={{ delay: index * 0.1 + detailIndex * 0.05, duration: 0.4 }}
								viewport={{ once: true }}
								whileInView={{ opacity: 1, x: 0 }}
							>
								<CheckCircle className='text-secondary mr-3 h-5 w-5 flex-shrink-0' />
								<span className='text-muted-foreground text-sm'>{detail}</span>
							</motion.div>
						))}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	)
}
