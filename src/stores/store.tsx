/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { create } from 'zustand'

type SideMenuOpenType = {
	isSideMenuOpen: boolean
	toggleSideMenuState: () => void
}

export const useSideMenuOpenStore = create<SideMenuOpenType>((set) => ({
	isSideMenuOpen: false,
	toggleSideMenuState: () => set((state) => ({ isSideMenuOpen: !state.isSideMenuOpen })),
}))
