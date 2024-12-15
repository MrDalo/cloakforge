'use client'

import React from 'react'
import Image from 'next/image'
import { useSideMenuOpenStore } from '@/stores/store'
import Link from 'next/link'
import BurgerButton from '@/../public/burger-button.svg'

const Header = (): React.ReactNode => {
  const { toggleSideMenuState, isSideMenuOpen } = useSideMenuOpenStore()
  return (
    <header className='flex h-[84px] w-full flex-row items-start justify-between gap-0 px-6 pt-6 lg:hidden'>
      <BurgerButton
        className='mr-5 mt-3 cursor-pointer'
        onClick={() => toggleSideMenuState()}
      />

      <Link className={`${isSideMenuOpen && 'hidden'}`} href='/dashboard'>
        <Image
          alt='statsly logo'
          className='cursor-pointer'
          height={40}
          onClick={() => toggleSideMenuState()}
          src='/CryptoForge-logo-without-rectangle.webp'
          width={40}
        />
      </Link>
    </header>
  )
}

export default Header
