'use client'

import { LucideIcon } from 'lucide-react'

interface LegalSectionProps {
  icon: LucideIcon
  title: string
  description: string
  listItems: string[]
  iconVariant?: 'primary' | 'secondary' | 'warning'
}

export const LegalSection = ({
  icon: Icon,
  title,
  description,
  listItems,
  iconVariant = 'secondary',
}: LegalSectionProps): React.ReactNode => {
  const iconStyles = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    warning: 'bg-warning/80 text-warning-foreground/80',
  }

  return (
    <div className='mb-12'>
      <div className='mb-6 flex items-center space-x-3'>
        <div className={`${iconStyles[iconVariant]} flex h-10 w-10 items-center justify-center rounded-lg`}>
          <Icon className='h-5 w-5' />
        </div>
        <h2 className='text-2xl font-medium'>{title}</h2>
      </div>
      <p className='text-muted-foreground mb-4 leading-relaxed'>{description}</p>
      <ul className='text-muted-foreground ml-6 space-y-2'>
        {listItems.map((item, index) => (
          <li key={index}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}
