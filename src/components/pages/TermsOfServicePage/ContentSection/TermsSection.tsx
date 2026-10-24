import { type LucideIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface TermsSectionProps {
  icon: LucideIcon
  title: string
  sectionNumber: number
  children: React.ReactNode
  iconVariant?: 'default' | 'destructive' | 'warning'
  /** Optional element id so the section can be linked to (e.g. `/terms-of-service#contact`). */
  anchorId?: string
}

export const TermsSection = ({
  icon: Icon,
  title,
  sectionNumber,
  children,
  iconVariant = 'default',
  anchorId,
}: TermsSectionProps): React.ReactNode => {
  const getIconClasses = (): string => {
    switch (iconVariant) {
      case 'destructive':
        return 'bg-destructive/30 flex h-10 w-10 items-center justify-center rounded-lg'
      case 'warning':
        return 'bg-warning/70 flex h-10 w-10 items-center justify-center rounded-lg'
      default:
        return 'bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'
    }
  }

  const getIconColor = (): string => {
    switch (iconVariant) {
      case 'destructive':
        return 'text-destructive-foreground/80 h-5 w-5'
      case 'warning':
        return 'text-warning-foreground/80 h-5 w-5'
      default:
        return 'text-primary h-5 w-5'
    }
  }

  return (
    <>
      <div className='mb-12 scroll-mt-24' id={anchorId}>
        <div className='mb-6 flex items-center space-x-3'>
          <div className={getIconClasses()}>
            <Icon className={getIconColor()} />
          </div>
          <h2 className='text-2xl font-medium'>
            {sectionNumber}. {title}
          </h2>
        </div>
        {children}
      </div>

      <Separator className='my-8' />
    </>
  )
}
