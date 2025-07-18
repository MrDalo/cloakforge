'use client'
import React from 'react'
import { useSideMenuOpenStore } from '@/stores/store'

const SidebarFooter = (): React.ReactNode => {
	const { isSideMenuOpen } = useSideMenuOpenStore()
	return (
		<div
			className={`mt-auto flex w-full flex-row flex-nowrap justify-center duration-150 lg:hidden ${
				isSideMenuOpen ? 'gap-2 px-4' : 'gap-0 px-2'
			}`}
		/>
	)
}

export default SidebarFooter
