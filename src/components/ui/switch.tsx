'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

// Updated Switch component leveraging React 19's direct ref support
const Switch = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<
  typeof SwitchPrimitives.Root
>): React.ReactNode => (
  <SwitchPrimitives.Root
    className={cn(
      'inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'h-5 w-5 rounded-full bg-background shadow-lg data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchPrimitives.Root>
)

export { Switch }
