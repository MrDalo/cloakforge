// 'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import WalletConnectionButton from '../WalletConnectionButton/WalletConnectionButton'
import { MobileLogo } from './MobileLogo'
import { MobileNavigationMenu } from './MobileNavigationMenu'

interface MobileNavigationProps {
	isOpen: boolean
	setIsOpen: (isOpen: boolean) => void
}

export const MobileNavigation = ({ isOpen, setIsOpen }: MobileNavigationProps): React.ReactNode => (
	<div className='md:hidden'>
		<Sheet onOpenChange={setIsOpen} open={isOpen}>
			<SheetTrigger asChild>
				<Button className='h-9 w-9 p-0' size='sm' variant='ghost'>
					<Menu className='h-5 w-5' />
					<span className='sr-only'>Toggle navigation menu</span>
				</Button>
			</SheetTrigger>
			<SheetContent className='w-[300px] sm:w-[400px]' side='right'>
				<VisuallyHidden.Root>
					<SheetTitle>Navigation Menu</SheetTitle>
				</VisuallyHidden.Root>
				<div className='mt-6 flex flex-col space-y-6'>
					{/* Mobile Logo */}
					<MobileLogo />

					{/* Mobile Navigation */}
					<MobileNavigationMenu onLinkClick={() => setIsOpen(false)} />

					{/* Mobile Wallet Button */}
					<div className='flex w-full justify-center'>
						<WalletConnectionButton />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	</div>
)
