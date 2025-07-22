'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Zap, Lock, CheckCircle, Users, ShieldX, type LucideIcon } from 'lucide-react'

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
    title: 'Permanent decentralization',
    description: 'Irreversibly removes freeze authority to ensure complete token freedom',
    highlight: 'Irreversible',
  },
  {
    icon: CheckCircle,
    title: 'Community trust',
    description: 'Build trust with holders by demonstrating commitment to decentralization',
    highlight: 'Trust Building',
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
          Why Choose <span className='from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent'>CryptoForge</span> for
          Revoking Freeze Authority?
        </h2>
        <p className='text-muted-foreground mx-auto max-w-3xl text-lg'>
          The most secure and trusted platform for permanently revoking freeze authority on Solana blockchain
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
              <Card className='hover:border-secondary/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                <CardContent className='p-6'>
                  <motion.div
                    className='bg-secondary/10 group-hover:bg-secondary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300'
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Icon className='text-secondary h-8 w-8' />
                  </motion.div>

                  <Badge className='mb-3 text-xs' variant='secondary'>
                    {prop.highlight}
                  </Badge>

                  <h3 className='group-hover:text-secondary mb-3 font-medium transition-colors duration-300'>{prop.title}</h3>
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
        <Card className='from-secondary/15 to-secondary/5 border-secondary/20 border-2 bg-gradient-to-r'>
          <CardContent className='p-8'>
            <ShieldX className='text-secondary mx-auto mb-4 h-12 w-12' />
            <h3 className='mb-4 text-2xl'>Ready to Revoke Freeze Authority?</h3>
            <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>
              Join projects that trust CryptoForge for secure authority management. Professional tools, transparent fees, permanent results.
            </p>
            <Button
              className='bg-secondary hover:bg-secondary/90 rounded-xl px-8 py-3 text-white shadow-lg transition-all duration-300 hover:shadow-xl'
              size='lg'
            >
              Revoke Freeze Authority Now
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </section>
)
