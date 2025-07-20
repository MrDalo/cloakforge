'use client'

import { motion } from 'framer-motion'
import { quickStats } from './ctaData'

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

export const QuickStats = (): React.ReactNode => (
	<motion.div
		className='border-border mx-auto grid max-w-2xl grid-cols-3 gap-8 border-t pt-8'
		initial='hidden'
		variants={containerVariants}
		viewport={{ once: true }}
		whileInView='visible'
	>
		{quickStats.map((stat, index) => (
			<motion.div className='text-center' key={index} variants={itemVariants} whileHover={{ scale: 1.05 }}>
				<div className='crypto-text-gradient mb-2 text-2xl md:text-3xl'>{stat.value}</div>
				<div className='text-muted-foreground text-sm'>{stat.label}</div>
			</motion.div>
		))}
	</motion.div>
)
