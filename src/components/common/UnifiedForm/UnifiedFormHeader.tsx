import { type UnifiedFormHeaderProps, type GradientVariant } from './types'

const variantStyles: Record<GradientVariant, string> = {
  primary: 'text-primary',
  info: 'text-info-foreground',
  warning: 'text-warning-foreground',
  danger: 'text-destructive-foreground',
  success: 'text-success-foreground',
}

export const UnifiedFormHeader = ({ icon: Icon, title, variant = 'primary' }: UnifiedFormHeaderProps): React.ReactNode => (
  <div className='flex items-center justify-center space-x-3'>
    <Icon className={`h-6 w-6 ${variantStyles[variant]}`} />
    <span className='font-medium'>{title}</span>
  </div>
)
