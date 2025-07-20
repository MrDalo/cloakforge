'use client'
import { FeatureCard } from './FeatureCard'
import { features } from './platformFeaturesData'

export const FeaturesGrid = (): React.ReactNode => (
	<div className='mb-20 grid grid-cols-1 gap-8 lg:grid-cols-2'>
		{features.map((feature, index) => (
			<FeatureCard feature={feature} index={index} key={index} />
		))}
	</div>
)
