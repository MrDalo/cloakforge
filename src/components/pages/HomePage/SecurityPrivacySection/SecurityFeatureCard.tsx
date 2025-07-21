'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { SecurityFeature, cardVariants } from './securityData'

interface SecurityFeatureCardProps {
  feature: SecurityFeature
  index: number
}

export const SecurityFeatureCard = ({ feature, index }: SecurityFeatureCardProps): React.ReactNode => {
  const Icon = feature.icon

  return (
    <motion.div className='group' variants={cardVariants} whileHover={{ y: -5 }}>
      <Card className='hover:border-secondary/30 bg-card privacy-glow h-full border-2 transition-all duration-300 hover:shadow-xl'>
        <CardContent className='p-8'>
          <motion.div
            className={`h-16 w-16 rounded-2xl ${feature.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'} mb-6 flex items-center justify-center ${feature.color === 'primary' ? 'group-hover:bg-primary/20' : 'group-hover:bg-secondary/20'} shield-pulse transition-all duration-300`}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon className={`h-8 w-8 ${feature.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
          </motion.div>

          <h3 className='group-hover:text-secondary mb-4 text-2xl transition-colors duration-300'>{feature.title}</h3>
          <p className='text-muted-foreground mb-6 leading-relaxed'>{feature.description}</p>

          <div className='space-y-3'>
            {feature.details.map((detail, detailIndex) => (
              <motion.div
                className='flex items-center'
                initial={{ opacity: 0, x: -20 }}
                key={detailIndex}
                transition={{ delay: index * 0.1 + detailIndex * 0.05, duration: 0.4 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <CheckCircle className='text-secondary mr-3 h-5 w-5 flex-shrink-0' />
                <span className='text-muted-foreground text-sm'>{detail}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
