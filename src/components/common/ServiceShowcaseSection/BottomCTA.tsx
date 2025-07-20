'use client'

import { motion } from 'framer-motion'
import { Coins } from 'lucide-react'

export const BottomCTA = (): React.ReactNode => (
	<motion.div
		className='mt-16 text-center'
		initial={{ opacity: 0, y: 30 }}
		transition={{ delay: 0.5, duration: 0.8 }}
		viewport={{ once: true }}
		whileInView={{ opacity: 1, y: 0 }}
	>
		<div className='from-primary/10 to-secondary/10 rounded-2xl bg-gradient-to-r p-8'>
			<Coins className='text-primary mx-auto mb-4 h-12 w-12' />
			<h4 className='mb-4 text-xl'>Ready to Start Building?</h4>
			<p className='text-muted-foreground mb-6'>All tools are fully on-chain and work directly with your wallet. No setup required.</p>
			<motion.button
				className='bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer rounded-xl px-8 py-3 shadow-lg transition-all duration-300 hover:shadow-xl'
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
			>
				Create Your Token
			</motion.button>
		</div>
	</motion.div>
)
