'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { cardVariants, type ComplianceItem } from './securityData'

interface ComplianceCardProps {
	item: ComplianceItem
}

export const ComplianceCard = ({ item }: ComplianceCardProps): React.ReactNode => {
	const IconComponent = item.icon

	return (
		<motion.div variants={cardVariants}>
			<Card className='group border-border bg-card hover:border-primary h-full cursor-pointer border transition-all duration-300 hover:shadow-lg'>
				<CardContent className='p-6'>
					<div className='mb-4 flex items-center justify-between'>
						<IconComponent className='text-primary h-8 w-8' />
					</div>
					<h4 className='mb-2 text-lg font-semibold'>{item.title}</h4>
					<p className='text-muted-foreground mb-4 text-sm'>{item.description}</p>
				</CardContent>
			</Card>
		</motion.div>
	)
}
