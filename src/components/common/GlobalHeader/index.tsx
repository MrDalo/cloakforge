'use client'

import { useState } from 'react'
import { Logo } from './Logo'
import { DesktopNavigation } from './DesktopNavigation'
import { MobileNavigation } from './MobileNavigation'

export const GlobalHeader = (): React.ReactNode => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className='border-border bg-card/95 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
      <div className='container mx-auto px-4 py-1 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <DesktopNavigation />

          {/* Mobile Menu */}
          <MobileNavigation isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
      </div>
    </header>
  )
}
