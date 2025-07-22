'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ValueProp {
  icon: LucideIcon
  title: string
  description: string
  highlight: string
}

export interface CTAConfig {
  icon: LucideIcon
  title: string
  description: string
  buttonText: string
  onButtonClick?: () => void
}

export interface BenefitsSectionConfig {
  title: string
  subtitle: string
  valueProps: ValueProp[]
  cta: CTAConfig
  colorScheme: {
    primary: string
    primaryHover: string
    background: string
    backgroundHover: string
    border: string
    borderHover: string
    textGradient: string
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
    ctaBackground: string
    ctaButton: string
  }
}

interface BenefitsSectionProps {
  config: BenefitsSectionConfig
}

export const BenefitsSection = ({ config }: BenefitsSectionProps): React.ReactNode => {
  const { title, subtitle, valueProps, cta, colorScheme } = config

  return (
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-6xl'>
        {/* Header */}
        <motion.div
          className='mb-16 text-center'
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className='mb-6 text-3xl md:text-4xl'>
            Why Choose <span className={colorScheme.textGradient}>CryptoForge</span> for {title}?
          </h2>
          <p className='text-muted-foreground mx-auto max-w-3xl text-lg'>{subtitle}</p>
        </motion.div>

        {/* Value Props Grid */}
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5'>
          {valueProps.map((prop, index) => {
            const Icon = prop.icon
            return (
              <motion.div
                className='group'
                initial={{ opacity: 0, y: 30 }}
                key={index}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Card className={`${colorScheme.borderHover} h-full border-2 text-center transition-all duration-300 hover:shadow-xl`}>
                  <CardContent className='p-6'>
                    <motion.div
                      className={`${colorScheme.background} ${colorScheme.backgroundHover} mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300`}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Icon className={`${colorScheme.primary} h-8 w-8`} />
                    </motion.div>

                    <Badge className='mb-3 text-xs' variant={colorScheme.badgeVariant}>
                      {prop.highlight}
                    </Badge>

                    <h3 className={`${colorScheme.primaryHover} mb-3 font-medium transition-colors duration-300`}>{prop.title}</h3>
                    <p className='text-muted-foreground text-sm'>{prop.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className='mt-16 text-center'
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Card className={`${colorScheme.ctaBackground} border-0 shadow-md`}>
            <CardContent className='p-8'>
              <cta.icon className={`${colorScheme.primary} mx-auto mb-4 h-12 w-12`} />
              <h3 className='mb-4 text-2xl'>{cta.title}</h3>
              <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>{cta.description}</p>
              <Button
                className={cn(
                  'rounded-xl px-8 py-3 text-white shadow-lg transition-all duration-200 hover:shadow-xl',
                  colorScheme.ctaButton
                )}
                onClick={cta.onButtonClick}
                size='lg'
              >
                {cta.buttonText}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
