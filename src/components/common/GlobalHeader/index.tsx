'use client'

import React from 'react'
import { useSideMenuOpenStore } from '@/stores/store'
import BurgerButton from '@/../public/burger-button.svg'
import WalletConnectionButton from '../WalletConnectionButton/WalletConnectionButton'

const GlobalHeader = (): React.ReactNode => {
	const { toggleSideMenuState } = useSideMenuOpenStore()
	return (
		<header className='bg-card flex w-full flex-row items-start justify-between gap-0 border px-6 py-2 lg:flex-row-reverse'>
			<BurgerButton className='mt-3 mr-5 flex cursor-pointer lg:hidden' onClick={() => toggleSideMenuState()} />

			<WalletConnectionButton />
		</header>
	)
}

export default GlobalHeader
