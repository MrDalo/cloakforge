'use client'

import { NavigationGrid } from './NavigationGrid'
import { NavigationHeader } from './NavigationHeader'

export const NavigationSection = (): React.ReactNode => (
  <div className='mt-16'>
    <NavigationHeader />
    <NavigationGrid />
  </div>
)
