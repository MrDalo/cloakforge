'use client'

import { motion } from 'framer-motion'
import { HeroBadge } from './HeroBadge'
import { HeroHeadline } from './HeroHeadline'
import { HeroSubtitle } from './HeroSubtitle'
import { KeyFeatures } from './KeyFeatures'
import { CTAButtons } from './CTAButtons'
import { TrustIndicators } from './TrustIndicators'

export const HeroContent = (): React.ReactNode => (
	<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 50 }} transition={{ duration: 0.8 }}>
		<HeroBadge />
		<HeroHeadline />
		<HeroSubtitle />
		<KeyFeatures />
		<CTAButtons />
		<TrustIndicators />
	</motion.div>
)
