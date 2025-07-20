'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export const HeroBadge = (): React.ReactNode => (
	<motion.div
		animate={{ opacity: 1, scale: 1 }}
		className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
		initial={{ opacity: 0, scale: 0 }}
		transition={{ delay: 0.2, duration: 0.5 }}
	>
		<Zap className='mr-2 h-4 w-4' />
		<span className='text-sm'>Fast • Secure • Decentralized</span>
	</motion.div>
)
