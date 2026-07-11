import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  info_description: string
  content_classname?: string
  icon_classname?: string
}

// Radix's Tooltip is hover/focus-only by design and actively closes on
// pointerdown/click, so it can't be adapted to tap-to-open on mobile.
// Popover is built for click/tap toggling and dismisses on outside
// click/tap natively, which also makes it work correctly on touch devices.
const InfoTooltip = ({ info_description, content_classname, icon_classname }: Props): React.ReactNode => (
  <Popover>
    <PopoverTrigger aria-label='More information' className='hover:cursor-pointer' type='button'>
      <Info className={icon_classname} size={14} />
    </PopoverTrigger>
    <PopoverContent className={cn('w-auto max-w-96 px-3 py-1.5 text-sm', content_classname)}>{info_description}</PopoverContent>
  </Popover>
)

export default InfoTooltip
