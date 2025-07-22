'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

// Updated Switch component leveraging React 19's direct ref support
const Switch = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>): React.ReactNode => (
  <SwitchPrimitives.Root
    className={cn(
      'focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-gray-300',
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'data-[state=checked]:bg-background h-5 w-5 rounded-full shadow-lg transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1 data-[state=unchecked]:bg-white'
      )}
    />
  </SwitchPrimitives.Root>
)

export { Switch }
