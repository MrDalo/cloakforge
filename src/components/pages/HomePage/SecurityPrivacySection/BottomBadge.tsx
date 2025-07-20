'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export const BottomBadge = (): React.ReactNode => (
	<motion.div
		className='mt-16 text-center'
		initial={{ opacity: 0, y: 30 }}
		transition={{ delay: 0.6, duration: 0.8 }}
		viewport={{ once: true }}
		whileInView={{ opacity: 1, y: 0 }}
	>
		<div className='from-secondary/10 to-primary/10 border-secondary/20 inline-flex items-center rounded-full border bg-gradient-to-r px-6 py-3'>
			<Shield className='text-secondary mr-2 h-5 w-5' />
			<span className='text-sm'>
				<strong>Privacy Promise:</strong> We don&apos;t know who you are, and we like it that way.
			</span>
		</div>
	</motion.div>
)
