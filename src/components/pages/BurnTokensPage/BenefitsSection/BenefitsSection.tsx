'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Zap, Lock, TrendingDown, Users, Flame, type LucideIcon } from 'lucide-react'

interface ValueProp {
  icon: LucideIcon
  title: string
  description: string
  highlight: string
}

const valueProps: ValueProp[] = [
  {
    icon: Shield,
    title: 'Secure & reliable',
    description: 'Built with industry-standard security practices and tested smart contracts',
    highlight: 'Secure',
  },
  {
    icon: Zap,
    title: 'Instant execution',
    description: 'Fast transaction processing on Solana network with minimal fees',
    highlight: 'One-click',
  },
  {
    icon: Lock,
    title: 'Permanent removal',
    description: 'Tokens are permanently removed from circulation with cryptographic proof',
    highlight: 'Irreversible',
  },
  {
    icon: TrendingDown,
    title: 'Supply control',
    description: 'Precise control over token economics and deflationary mechanisms',
    highlight: 'Deflationary',
  },
  {
    icon: Users,
    title: 'Community driven',
    description: 'Open-source platform trusted by thousands of token creators',
    highlight: 'Trusted',
  },
]

export const BenefitsSection = (): React.ReactNode => (
  <section className='px-6 py-16'>
    <div className='container mx-auto max-w-6xl'>
      <motion.div
        className='mb-16 text-center'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2 className='mb-6 text-3xl md:text-4xl'>
          Why Choose{' '}
          <span className='from-destructive-foreground/60 to-warning bg-gradient-to-r bg-clip-text text-transparent'>CryptoForge</span> for
          Token Burning?
        </h2>
        <p className='text-muted-foreground mx-auto max-w-3xl text-lg'>
          The most secure and trusted platform for permanently burning tokens on Solana blockchain
        </p>
      </motion.div>

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
              <Card className='hover:border-destructive-foreground/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                <CardContent className='p-6'>
                  <motion.div
                    className='bg-destructive/10 group-hover:bg-destructive/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300'
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Icon className='text-destructive-foreground/80 h-8 w-8' />
                  </motion.div>

                  <Badge className='mb-3 text-xs' variant='destructive'>
                    {prop.highlight}
                  </Badge>

                  <h3 className='group-hover:text-destructive-foreground mb-3 font-medium transition-colors duration-300'>{prop.title}</h3>
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
        <Card className='from-destructive/10 border-destructive/20 border-2 bg-gradient-to-r to-orange-500/10'>
          <CardContent className='p-8'>
            <Flame className='text-destructive mx-auto mb-4 h-12 w-12' />
            <h3 className='mb-4 text-2xl'>Ready to Burn Your Tokens?</h3>
            <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>
              Join projects that trust CryptoForge for secure token burning. Professional tools, transparent fees, permanent results.
            </p>
            <Button
              className='bg-destructive-foreground/80 hover:bg-destructive-foreground/65 rounded-xl px-8 py-3 text-white shadow-lg transition-all duration-300 hover:shadow-xl'
              size='lg'
            >
              Burn Tokens Now
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </section>
)
