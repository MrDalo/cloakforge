'use client'

import { motion } from 'framer-motion'
import { FeeCalculationNote } from './FeeCalculationNote'
import { NetworkFeeNote } from './NetworkFeeNote'

export const ImportantNotes = (): React.ReactNode => (
	<motion.div
		className='space-y-6'
		initial={{ opacity: 0, y: 30 }}
		transition={{ delay: 0.5, duration: 0.8 }}
		viewport={{ once: true }}
		whileInView={{ opacity: 1, y: 0 }}
	>
		<FeeCalculationNote />
		<NetworkFeeNote />
	</motion.div>
)
