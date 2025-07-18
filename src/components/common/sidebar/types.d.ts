type navigationItemsType = {
	title: string
	href?: string
	nestedNavigationItems?: nestedNavigationItemsType[]
}

type nestedNavigationItemsType = {
	title: string
	href: string
	icon: React.ReactNode
}

export type { navigationItemsType, nestedNavigationItemsType }
