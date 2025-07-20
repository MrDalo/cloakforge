'use client'

import { SectionHeader } from './SectionHeader'
import { BenefitsGrid } from './BenefitsGrid'
import { ComparisonTable } from './ComparisonTable'
import { BottomCTA } from './BottomCTA'

export const WhyCryptoForgeSection = (): React.ReactNode => (
	<section className='from-background to-muted/30 relative overflow-hidden bg-gradient-to-br px-6 py-20'>
		<div className='relative z-10 container mx-auto max-w-7xl'>
			<SectionHeader />
			<BenefitsGrid />
			<ComparisonTable />
			<BottomCTA />
		</div>
	</section>
)
