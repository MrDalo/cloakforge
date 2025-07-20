'use client'

import { BottomCTA } from './BottomCTA'
import { CostOptimizationSection } from './CostOptimizationSection'
import { FeeBreakdownSection } from './FeeBreakdownSection'
import { FeeTable } from './FeeTable'
import { ImportantNotes } from './ImportantNotes'
import { SectionHeader } from './SectionHeader'

export const PricingSection = (): React.ReactNode => (
	<section className='from-background via-muted/20 to-background relative overflow-hidden bg-gradient-to-br px-6 py-20'>
		<div className='relative z-10 container mx-auto max-w-7xl'>
			<SectionHeader />
			<FeeBreakdownSection />
			<FeeTable />
			<CostOptimizationSection />
			<ImportantNotes />
			<BottomCTA />
		</div>
	</section>
)
