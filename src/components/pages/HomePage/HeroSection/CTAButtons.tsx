'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const CTAButtons = (): React.ReactNode => (
	<motion.div
		animate={{ opacity: 1, y: 0 }}
		className='flex flex-col gap-4 sm:flex-row'
		initial={{ opacity: 0, y: 20 }}
		transition={{ delay: 0.7, duration: 0.8 }}
	>
		<Button className='bg-primary hover:bg-primary-hover text-primary-foreground flex w-fit items-center justify-center rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
			<span>Create Your Token</span>
			<ArrowRight className='size-5' />
		</Button>
		<Button className='hover:bg-accent w-fit rounded-xl border-2 px-8 py-3 transition-all duration-300' variant='secondary'>
			View Security & Privacy
		</Button>
	</motion.div>
)
