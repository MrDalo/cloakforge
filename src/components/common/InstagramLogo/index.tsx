import Image from 'next/image'
import { cn } from '@/lib/utils'

interface InstagramLogoProps {
  size?: 'sm' | 'md' | 'lg' | number
  className?: string
  alt?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const

export const InstagramLogo = ({ size = 'md', className, alt = 'Instagram' }: InstagramLogoProps): React.ReactNode => {
  if (typeof size === 'number') {
    return (
      <Image
        alt={alt}
        className={cn('object-contain', className)}
        height={size}
        src='/instagram.svg'
        style={{ width: `${size}px`, height: `${size}px` }}
        width={size}
      />
    )
  }

  return (
    <div className={cn(sizeMap[size], 'relative', className)}>
      <Image alt={alt} className='object-contain' fill sizes='24px' src='/instagram.svg' />
    </div>
  )
}
