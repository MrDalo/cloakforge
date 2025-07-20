'use client'

import { BenefitCard } from './BenefitCard'
import { benefits } from './whyCryptoForgeData'

export const BenefitsGrid = (): React.ReactNode => (
	<div className='mb-20 grid grid-cols-1 gap-8 md:grid-cols-2'>
		{benefits.map((benefit, index) => (
			<BenefitCard benefit={benefit} index={index} key={index} />
		))}
	</div>
)
