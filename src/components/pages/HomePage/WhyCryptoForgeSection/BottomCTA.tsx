'use client'

import WalletConnectionButton from '@/components/common/WalletConnectionButton/WalletConnectionButton'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export const BottomCTA = (): React.ReactNode => (
	<motion.div
		className='mt-16 text-center'
		initial={{ opacity: 0, y: 30 }}
		transition={{ delay: 0.5, duration: 0.8 }}
		viewport={{ once: true }}
		whileInView={{ opacity: 1, y: 0 }}
	>
		<div className='from-primary/10 to-secondary/10 rounded-2xl bg-gradient-to-r p-8'>
			<Zap className='text-primary mx-auto mb-4 h-12 w-12' />
			<h4 className='mb-4 text-xl'>Ready to Experience Web3 Freedom?</h4>
			<p className='text-muted-foreground mb-6'>Join the movement toward truly decentralized, user-controlled financial tools.</p>
			<WalletConnectionButton position='top' />
		</div>
	</motion.div>
)
