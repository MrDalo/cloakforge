import { useSideMenuOpenStore } from '@/stores/store'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import BurgerButton from '@/../public/burger-button.svg'

const SidebarHeader = (): React.ReactNode => {
  const { isSideMenuOpen, toggleSideMenuState } = useSideMenuOpenStore()
  return (
    <div className='flex w-full flex-row-reverse flex-nowrap items-center justify-between lg:flex-row'>
      <div
        className={`flex flex-row flex-nowrap duration-150 ${
          isSideMenuOpen ? 'gap-2 pr-5 lg:pl-4 lg:pr-0' : 'gap-0 pl-3'
        }`}
      >
        <div className='relative size-14 lg:size-11'>
          <Image
            alt='statsly logo'
            className='cursor-pointer'
            fill
            onClick={() => toggleSideMenuState()}
            src='/CryptoForge-logo-without-rectangle.webp'
            style={{ objectFit: 'contain' }}
          />
        </div>

        <Link
          className={`flex items-center whitespace-nowrap text-[2rem] font-bold text-primary ${
            isSideMenuOpen
              ? 'relative opacity-100 duration-300'
              : 'absolute left-[-100px] z-[-1] cursor-default opacity-0 duration-0'
          }`}
          href='/'
        >
          {/* Crypto Forge */}
        </Link>
        {!isSideMenuOpen && (
          <div
            className='flex cursor-pointer items-center'
            onClick={() => toggleSideMenuState()}
          >
            <ChevronRight className='hidden text-primary lg:block' />
          </div>
        )}
      </div>
      {isSideMenuOpen && (
        <BurgerButton
          className='ml-6 cursor-pointer lg:ml-0 lg:mr-5'
          onClick={() => toggleSideMenuState()}
        />
      )}
    </div>
  )
}

export default SidebarHeader
