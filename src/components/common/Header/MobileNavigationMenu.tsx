import { Home } from 'lucide-react'
import Link from 'next/link'
import { navigationItems } from './navigationData'

interface MobileNavigationMenuProps {
	onLinkClick: () => void
}

export const MobileNavigationMenu = ({ onLinkClick }: MobileNavigationMenuProps): React.ReactNode => (
	<nav className='flex flex-col space-y-4'>
		{/* Home */}
		<Link
			className='hover:bg-accent flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200'
			href='/'
			onClick={onLinkClick}
		>
			<div className='bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
				<Home className='text-primary h-4 w-4' />
			</div>
			<span>Home</span>
		</Link>

		{/* Tools Section */}
		<div className='space-y-2'>
			<h3 className='text-muted-foreground px-3 text-sm font-medium'>Tools</h3>
			<div className='space-y-1'>
				{navigationItems[0].items.map((item) => {
					const Icon = item.icon
					return (
						<Link
							className='hover:bg-accent flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200'
							href={item.href}
							key={item.title}
							onClick={onLinkClick}
						>
							<div className='bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
								<Icon className='text-primary h-4 w-4' />
							</div>
							<div>
								<div className='text-sm font-medium'>{item.title}</div>
								<p className='text-muted-foreground line-clamp-1 text-xs'>{item.description}</p>
							</div>
						</Link>
					)
				})}
			</div>
		</div>
	</nav>
)
