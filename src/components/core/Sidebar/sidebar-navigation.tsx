'use client'
import { useSideMenuOpenStore } from '@/stores/store'
import { usePathname } from 'next/navigation'
import React, { useCallback } from 'react'
import { navigationItemsType } from './types'
import { Ban, Coins, Flame, Home, Split, WavesLadder } from 'lucide-react'
import { NavListItem } from './nav-list-item'

const navigationItems: navigationItemsType[] = [
  {
    title: 'Media kit',
    nestedNavigationItems: [
      {
        title: 'Home',
        href: '/',
        icon: <Home className='font-light' size={20} />,
      },
      {
        title: 'Token Creator',
        href: '/token-creator',
        icon: <Coins className='font-light' size={20} />,
      },
      {
        title: 'Create Liquidity',
        href: '/create-liquidity',
        icon: <WavesLadder className='font-light' size={20} />,
      },
      {
        title: 'Burn Tokens',
        href: '/burn-tokens',
        icon: <Flame className='font-light' size={20} />,
      },
      {
        title: 'Revoke Mint Authority',
        href: '/revoke-mint-authority',
        icon: <Ban className='font-light' size={20} />,
      },
      {
        title: 'Transaction multisender',
        href: '/transaction-multisender',
        icon: <Split className='font-light' size={20} />,
      },
    ],
  },
]

const SidebarNavigation = (): React.ReactNode => {
  const { isSideMenuOpen, toggleSideMenuState } = useSideMenuOpenStore()
  const pathname = usePathname()

  const isActiveFunction = useCallback(
    (URL: string) => {
      if (URL === '/') return pathname === URL
      return pathname.includes(URL)
    },
    [pathname]
  )
  return (
    <nav
      className={`flex w-full flex-col items-center justify-center ${
        !isSideMenuOpen && 'hidden lg:inline-block'
      }`}
    >
      {navigationItems.map((item) => (
        <div
          className={`w-full overflow-x-hidden duration-200 ${
            isSideMenuOpen ? 'px-4' : 'px-2'
          }`}
          key={item.title}
        >
          <p
            className={`w-full border-b border-foreground/50 px-5 ${
              isSideMenuOpen ? 'py-3' : 'py-[12px]'
            } text-xs font-light`}
          />
          <ul className='mt-1 flex w-full flex-col items-start justify-start gap-1'>
            {item.nestedNavigationItems &&
              item.nestedNavigationItems.map((nestedItem) => (
                <NavListItem
                  href={nestedItem.href}
                  isActive={isActiveFunction(nestedItem.href)}
                  isOpen={isSideMenuOpen}
                  key={nestedItem.title}
                  onClickFunction={() =>
                    window.innerWidth < 1024 ? toggleSideMenuState() : null
                  }
                  title={nestedItem.title}
                >
                  {nestedItem.icon}
                </NavListItem>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export default SidebarNavigation
