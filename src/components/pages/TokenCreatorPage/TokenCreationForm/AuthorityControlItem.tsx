import { HelpCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface AuthorityControlItemProps {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const AuthorityControlItem = ({ id, label, description, checked, onCheckedChange }: AuthorityControlItemProps): React.ReactNode => (
  <div className='bg-muted/50 flex items-center justify-between rounded-lg p-4'>
    <div className='flex items-center space-x-3'>
      <div>
        <Label className='cursor-pointer' htmlFor={id}>
          {label}
        </Label>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
      <Tooltip>
        <TooltipTrigger>
          <HelpCircle className='text-muted-foreground h-4 w-4' />
        </TooltipTrigger>
        <TooltipContent>
          <p className='max-w-xs'>{description}</p>
        </TooltipContent>
      </Tooltip>
    </div>
    <Switch checked={checked} id={id} onCheckedChange={onCheckedChange} />
  </div>
)
