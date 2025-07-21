'use client'

import { motion } from 'framer-motion'

export const HeroSubtitle = (): React.ReactNode => (
	<motion.p
		animate={{ opacity: 1, y: 0 }}
		className='text-muted-foreground mb-8 text-lg leading-relaxed md:text-xl'
		initial={{ opacity: 0, y: 20 }}
		transition={{ delay: 0.4, duration: 0.8 }}
	>
		Your all-in-one Solana token utility suite — fast, secure, and open. Create tokens, manage liquidity, and control your digital assets with
		professional-grade tools.
	</motion.p>
)
