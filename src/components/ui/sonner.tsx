'use client'

import { Toaster } from 'sonner'
import React from 'react'

export type NotificationProps = Omit<React.ComponentProps<typeof Toaster>, 'richColors'>

const Notification = ({ ...otherProps }: NotificationProps): React.ReactNode => (
	<Toaster
		className='toaster group'
		position={otherProps.position || 'bottom-right'}
		toastOptions={{
			classNames: {
				toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground border-none group-[.toaster]:shadow-lg',
				description: 'group-[.toast]:text-foreground',
				actionButton: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground',
				cancelButton: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground',
				error: 'bg-destructive! text-destructive-foreground!',
				success: 'bg-success! text-success-foreground!',
				info: 'bg-info! text-info-foreground!',
				warning: 'bg-warning! text-warning-foreground!',
				icon: 'group-data-[type=success]:text-success-standard group-data-[type=error]:text-destructive-standard group-data-[type=info]:text-info-standard group-data-[type=warning]:text-warning-standard',
			},
		}}
		{...otherProps}
	/>
)

export default Notification
