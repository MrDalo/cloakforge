'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const CTAButtons = (): React.ReactNode => (
	<motion.div
		className='mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row'
		initial={{ opacity: 0, y: 20 }}
		transition={{ delay: 0.7, duration: 0.8 }}
		viewport={{ once: true }}
		whileInView={{ opacity: 1, y: 0 }}
	>
		<Button
			asChild
			className='bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl px-8 py-4 text-lg shadow-lg transition-all duration-300 hover:shadow-xl'
			size='lg'
		>
			<Link href='/tools/token-creator'>
				<span>Create Your Token</span>
				<ArrowRight className='ml-2 h-5 w-5' />
			</Link>
		</Button>

		<div className='text-muted-foreground flex items-center gap-4 text-sm'>
			<div className='flex items-center'>
				<Shield className='mr-1 h-4 w-4' />
				Secure & reliable
			</div>
		</div>
	</motion.div>
)
