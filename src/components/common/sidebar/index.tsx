'use client'

import React from 'react'
import { useSideMenuOpenStore } from '@/stores/store'
import { cn } from '@/lib/utils'
import SidebarHeader from './SidebarHeader'
import SidebarNavigation from './SidebarNavigation'

const Sidebar = (): React.ReactNode => {
	const { isSideMenuOpen } = useSideMenuOpenStore()

	return (
		<aside
			className={cn(
				'absolute top-0 left-0 z-30 box-border h-screen w-[90vw] shrink-0 overflow-hidden',
				'border-border bg-card border-r px-5 py-5 duration-300 lg:relative lg:w-72',
				isSideMenuOpen ? 'w-[90vw] px-5 lg:w-64' : 'w-0 px-0 lg:w-20 lg:px-2'
			)}
			data-testid='sidebar'
		>
			<div className='flex size-full flex-col flex-nowrap items-start justify-start gap-2'>
				<SidebarHeader />
				<SidebarNavigation />
				{/* <SidebarFooter /> */}
			</div>
		</aside>
	)
}

export default Sidebar
