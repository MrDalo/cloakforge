'use client'

import { motion } from 'framer-motion'
import { TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { ServiceFee } from './pricingData'

interface ServiceRowProps {
  service: ServiceFee
  index: number
}

export const ServiceRow = ({ service, index }: ServiceRowProps): React.ReactNode => {
  const Icon = service.icon

  return (
    <motion.tr
      className='border-border/50 hover:bg-muted/20 group border-b transition-colors duration-300'
      initial={{ opacity: 0, x: -20 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, x: 0 }}
    >
      <TableCell className='px-6 py-6'>
        <div className='flex items-center space-x-4'>
          <div className='bg-primary/10 group-hover:bg-primary/20 flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-300'>
            <Icon className='text-primary h-5 w-5' />
          </div>
          <div>
            <div className='font-medium'>{service.service}</div>
            <div className='text-muted-foreground text-sm'>{service.description}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className='px-4 py-6 text-center'>
        <div className='text-primary font-medium'>{service.fee}</div>
      </TableCell>
      <TableCell className='px-4 py-6 text-center'>
        <div className='text-muted-foreground text-sm'>{service.estimatedNetwork}</div>
      </TableCell>
      <TableCell className='px-4 py-6 text-center'>
        <Badge
          className='text-xs'
          variant={
            service.complexity === 'Low' ? 'secondary'
            : service.complexity === 'Medium' ?
              'default'
            : 'destructive'
          }
        >
          {service.complexity}
        </Badge>
      </TableCell>
      <TableCell className='px-4 py-6 text-center'>
        {service.popular && (
          <Badge className='text-secondary border-secondary text-xs' variant='outline'>
            Popular
          </Badge>
        )}
      </TableCell>
    </motion.tr>
  )
}
