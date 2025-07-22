'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'
import { BottomCTA } from './BottomCTA'
import { features } from '../tokenCreatorData'

const valueProps = [
  {
    icon: features[0].icon,
    title: 'Lowest fees',
    description: 'Transparent pricing with no hidden costs or percentages',
    highlight: '0.1 SOL',
  },
  {
    icon: features[1].icon,
    title: 'Seamless metadata',
    description: 'Automatic IPFS upload and JSON metadata creation',
    highlight: 'Auto IPFS',
  },
  {
    icon: features[2].icon,
    title: 'Authority control',
    description: 'Full control over mint and freeze authorities',
    highlight: 'Full Control',
  },
  {
    icon: features[3].icon,
    title: 'Privacy-first',
    description: 'No cookies, no analytics, no personal data stored',
    highlight: 'No tracking',
  },
  {
    icon: features[4].icon,
    title: 'Devnet testing',
    description: 'Test your tokens safely before mainnet deployment',
    highlight: 'Test first',
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
          Why Choose <span className='crypto-text-gradient'>CryptoForge</span> for Token Creation?
        </h2>
        <p className='text-muted-foreground mx-auto max-w-3xl text-lg'>
          The most trusted platform for creating Solana SPL tokens with professional-grade tools and features
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
              <Card className='hover:border-primary/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                <CardContent className='p-6'>
                  <motion.div
                    className='bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300'
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Icon className='text-primary h-8 w-8' />
                  </motion.div>

                  <Badge className='mb-3 text-xs' variant='secondary'>
                    {prop.highlight}
                  </Badge>

                  <h3 className='group-hover:text-primary mb-3 font-medium transition-colors duration-300'>{prop.title}</h3>
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
        <Card className='from-primary/10 to-secondary/10 border-primary/20 border-2 bg-gradient-to-r'>
          <CardContent className='p-8'>
            <Sparkles className='text-primary mx-auto mb-4 h-12 w-12' />
            <h3 className='mb-4 text-2xl'>Ready to Launch Your Token?</h3>
            <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>
              Join thousands of creators who have built successful tokens on Solana with our professional-grade platform.
            </p>
            <BottomCTA />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </section>
)
