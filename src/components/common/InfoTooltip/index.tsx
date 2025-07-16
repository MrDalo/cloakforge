import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  info_description: string
  content_classname?: string
  icon_classname?: string
}

const InfoTooltip = ({
  info_description,
  content_classname,
  icon_classname,
}: Props): React.ReactNode => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger>
        <Info className={icon_classname} size={14} />
      </TooltipTrigger>
      <TooltipContent className={cn('max-w-96', content_classname)}>
        {info_description}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export default InfoTooltip
