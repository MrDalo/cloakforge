import { useSideMenuOpenStore } from '@/stores/store'
import React from 'react'
import BurgerButton from '@/../public/burger-button.svg'

const SidebarHeader = (): React.ReactNode => {
	const { isSideMenuOpen, toggleSideMenuState } = useSideMenuOpenStore()
	return (
		<div className='flex w-full flex-nowrap items-center justify-end lg:flex-row'>
			{isSideMenuOpen ? (
				<BurgerButton className='cursor-pointer' onClick={() => toggleSideMenuState()} />
			) : (
				<div className='flex w-full cursor-pointer items-center justify-center'>
					<BurgerButton className='cursor-pointer' onClick={() => toggleSideMenuState()} />
				</div>
			)}
		</div>
	)
}

export default SidebarHeader
