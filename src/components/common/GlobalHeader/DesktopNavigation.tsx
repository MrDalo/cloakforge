'use client'

import Link from 'next/link'
import WalletConnectionButton from '../WalletConnectionButton/WalletConnectionButton'
import { ToolsMenu } from './ToolsMenu'
import { OthersMenu } from './OthersMenu'
import { defaultNavigationItems } from './navigationData'

export const DesktopNavigation = (): React.ReactNode => (
  <>
    {/* Desktop Navigation */}
    <nav className='hidden items-center md:flex'>
      {defaultNavigationItems[0].items.map((item) => (
        <Link
          className='text-muted-foreground hover:text-foreground flex items-center px-4 py-2 transition-colors duration-200'
          href={item.href}
          key={item.title}
        >
          <span>{item.title}</span>
        </Link>
      ))}

      {/* Tools Dropdown */}
      <ToolsMenu />

      {/* Others Dropdown */}
      <OthersMenu />
    </nav>

    {/* Desktop Wallet Button */}
    <div className='hidden items-center space-x-4 md:flex'>
      <WalletConnectionButton />
    </div>
  </>
)
