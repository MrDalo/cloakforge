import { FeaturesGrid } from './FeaturesGrid'
import { SectionHeader } from './SectionHeader'
import { StatsSection } from './StatsSection'
import { Timeline } from './Timeline'

export const PlatformFeatures = (): React.ReactNode => (
	<section className='from-muted/30 to-background bg-gradient-to-br px-6 py-20'>
		<div className='container mx-auto max-w-7xl'>
			<SectionHeader />
			<FeaturesGrid />
			<StatsSection />
			<Timeline />
		</div>
	</section>
)
