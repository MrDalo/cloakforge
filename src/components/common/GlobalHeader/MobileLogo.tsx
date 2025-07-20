'use client'

import Image from 'next/image'

export const MobileLogo = (): React.ReactNode => (
	<div className='flex items-center space-x-3 pl-3'>
		<div className='relative size-10 overflow-hidden rounded-lg'>
			<Image alt='Crypto Forge' className='h-full w-full object-contain' fill src='/CryptoForge-logo-without-rectangle.webp' />
		</div>
		<span className='text-lg font-medium'>Crypto Forge</span>
	</div>
)
