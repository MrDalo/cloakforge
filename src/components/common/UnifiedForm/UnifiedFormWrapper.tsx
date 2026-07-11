'use client'

import { type UnifiedFormWrapperProps } from './types'
import { cn } from '@/lib/utils'

export const UnifiedFormWrapper = ({ children, className, id }: UnifiedFormWrapperProps): React.ReactNode => (
  <section className={cn('px-6 py-16', className)} id={id}>
    <div className='container mx-auto max-w-4xl'>
      <div className='mb-12'>{children}</div>
    </div>
  </section>
)
