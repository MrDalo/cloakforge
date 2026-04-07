import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UnifiedFormCardProps, GradientVariant } from './types'
import { UnifiedFormHeader } from './UnifiedFormHeader'

const gradientVariants: Record<GradientVariant, string> = {
  primary: 'from-primary/5 to-secondary/5',
  info: 'from-info/50 to-info/25',
  warning: 'from-warning/50 to-warning/25',
  danger: 'from-destructive/50 to-destructive/25',
  success: 'from-success/50 to-success/25',
  emerald: 'from-emerald-500/50 to-emerald-500/25',
}

export const UnifiedFormCard = ({ children, variant = 'primary', header }: UnifiedFormCardProps): React.ReactNode => (
  <Card className='border-border bg-card border-2 shadow-xl'>
    <CardHeader className={`border-border border-b bg-gradient-to-r ${gradientVariants[variant]}`}>
      <CardTitle className='text-center'>
        <UnifiedFormHeader icon={header.icon} title={header.title} variant={header.variant || variant} />
      </CardTitle>
    </CardHeader>
    <CardContent className='p-8'>{children}</CardContent>
  </Card>
)
