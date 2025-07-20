'use client'

import { motion } from 'framer-motion'

export const BackgroundElements = (): React.ReactNode => (
	<>
		{/* Background Elements */}
		<div className='security-mesh absolute inset-0 opacity-30' />
		<div className='absolute inset-0 overflow-hidden'>
			<motion.div
				animate={{
					rotate: [0, 360],
					scale: [1, 1.1, 1],
				}}
				className='border-secondary/20 encrypted-pattern absolute top-20 right-20 h-32 w-32 rounded-full border-2'
				transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
			/>
			<motion.div
				animate={{
					x: [0, 50, 0],
					y: [0, -30, 0],
				}}
				className='bg-primary/10 blockchain-pattern absolute bottom-20 left-20 h-24 w-24 rounded-2xl'
				transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
			/>
		</div>
	</>
)
