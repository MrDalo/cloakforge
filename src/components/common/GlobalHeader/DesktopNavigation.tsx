'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'
import WalletConnectionButton from '../WalletConnectionButton/WalletConnectionButton'
import { ToolsMenu } from './ToolsMenu'
import { OthersMenu } from './OthersMenu'

export const DesktopNavigation = (): React.ReactNode => (
  <>
    {/* Desktop Navigation */}
    <nav className='hidden items-center space-x-6 md:flex'>
      {/* Home Link */}
      <Link className='text-muted-foreground hover:text-foreground flex items-center space-x-2 transition-colors duration-200' href='/'>
        <Home className='h-4 w-4' />
        <span>Home</span>
      </Link>

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
