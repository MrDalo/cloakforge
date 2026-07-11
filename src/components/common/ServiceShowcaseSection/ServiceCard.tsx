'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { type Service, cardVariants } from './serviceData'
import Link from 'next/link'

interface ServiceCardProps {
  service: Service
}

export const ServiceCard = ({ service }: ServiceCardProps): React.ReactNode => {
  const Icon = service.icon

  return (
    <motion.div
      className='group'
      variants={cardVariants}
      whileHover={{
        y: -8,
        transition: { duration: 0.3 },
      }}
    >
      <Card className='hover:border-primary/30 bg-card h-full border-2 transition-all duration-300 hover:shadow-xl'>
        <CardContent className='p-6'>
          {/* Header with Badge */}
          <div className='mb-4 flex items-start justify-between'>
            <motion.div
              className={`h-14 w-14 rounded-xl ${
                service.color === 'primary'
                  ? 'bg-primary'
                  : service.color === 'secondary'
                    ? 'bg-secondary'
                    : service.color === 'destructive'
                      ? 'bg-destructive-foreground/40'
                      : service.color === 'warning'
                        ? 'bg-warning-foreground/40'
                        : 'bg-info-foreground/40'
              } flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl`}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Icon className='h-7 w-7 text-white' />
            </motion.div>

            <div className='bg-secondary/10 text-secondary rounded-full px-2 py-1 text-sm'>{service.highlight}</div>
          </div>

          {/* Content */}
          <h3 className='group-hover:text-primary mb-3 text-xl transition-colors duration-300'>{service.title}</h3>
          <p className='text-muted-foreground mb-4 leading-relaxed'>{service.description}</p>

          {/* Features */}
          <div className='mb-6 space-y-2'>
            {service.features.map((feature, index) => (
              <div className='text-muted-foreground flex items-center text-sm' key={index}>
                <div className='bg-primary mr-2 h-1.5 w-1.5 rounded-full' />
                {feature}
              </div>
            ))}
          </div>

          {/* Action */}
          <motion.div
            className='text-primary group-hover:text-primary-hover flex cursor-pointer items-center transition-colors duration-300'
            whileHover={{ x: 5 }}
          >
            <Link className='text-sm' href={service.href}>
              Use Tool
            </Link>
            <ArrowRight className='ml-2 h-4 w-4' />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
