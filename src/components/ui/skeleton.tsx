import { cn } from '@/lib/utils'

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactNode => (
  <div
    className={cn('animate-pulse rounded-md bg-primary/10', className)}
    {...props}
  />
)

export { Skeleton }
