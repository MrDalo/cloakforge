'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export const BottomCTA = (): React.ReactNode => (
  <Button className='group' size='lg'>
    Get Started Now
    <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
  </Button>
)
