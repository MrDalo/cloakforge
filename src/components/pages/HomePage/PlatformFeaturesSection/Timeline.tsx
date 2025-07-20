'use client'

import { motion } from 'framer-motion'
import { timelineData, type TimelineStep } from './platformFeaturesData'
import { TimelineStepComponent } from './TimelineStepComponent'

export const Timeline = (): React.ReactNode => (
	<div className='my-20'>
		<motion.div
			className='mb-16 text-center'
			initial={{ opacity: 0, y: 30 }}
			transition={{ duration: 0.8 }}
			viewport={{ once: true }}
			whileInView={{ opacity: 1, y: 0 }}
		>
			<h3 className='mb-4 text-3xl font-bold'>Your Token Journey, Simplified</h3>
			<p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
				From concept to deployment in minutes, not hours. Our streamlined process makes token creation accessible to everyone.
			</p>
		</motion.div>
		<div className='grid gap-8 md:grid-cols-3'>
			{timelineData.map((step: TimelineStep, index: number) => (
				<TimelineStepComponent index={index} key={step.step} step={step} />
			))}
		</div>
	</div>
)
