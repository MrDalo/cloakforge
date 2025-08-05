'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

const Avatar = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>): React.ReactNode => (
  <AvatarPrimitive.Root
    className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
    data-slot='avatar'
    {...props}
  />
)

const AvatarImage = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>): React.ReactNode => (
  <AvatarPrimitive.Image className={cn('aspect-square size-full', className)} data-slot='avatar-image' {...props} />
)

const AvatarFallback = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>): React.ReactNode => (
  <AvatarPrimitive.Fallback
    className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
    data-slot='avatar-fallback'
    {...props}
  />
)

export { Avatar, AvatarImage, AvatarFallback }
