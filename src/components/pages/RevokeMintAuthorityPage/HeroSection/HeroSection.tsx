'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Ban, DollarSign, Shield, Sparkles, Eye, Code, Users, Globe, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: DollarSign,
    title: 'Lowest fees on the market',
    description: 'Just 0.015 SOL platform fee + network costs',
  },
  {
    icon: Shield,
    title: 'Build ultimate trust',
    description: 'Permanently cap your token supply forever',
  },
  {
    icon: Sparkles,
    title: 'Instant execution',
    description: 'Revoke mint authority in a single transaction',
  },
  {
    icon: Eye,
    title: 'Privacy-first: no tracking',
    description: 'No cookies, no analytics, no personal data stored',
  },
  {
    icon: Code,
    title: 'Simulation/devnet support',
    description: 'Test your revocation safely before mainnet execution',
  },
]

const trustReasons = [
  {
    icon: Users,
    title: 'Community Confidence',
    description: 'Show your community you believe in fixed supply economics',
  },
  {
    icon: Globe,
    title: 'Anti-Inflation',
    description: 'Permanently prevent token dilution and protect holder value',
  },
  {
    icon: TrendingUp,
    title: 'Market Value',
    description: 'Tokens with revoked mint authority often have higher confidence',
  },
]

export const HeroSection = (): React.ReactNode => (
  <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
    {/* Background Elements */}
    <div className='absolute inset-0 overflow-hidden'>
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -30, 0],
          rotate: [0, 15, 0],
        }}
        className='border-secondary/20 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-lg border-2'
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      >
        <Ban className='text-secondary/40 h-6 w-6' />
      </motion.div>

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        className='bg-secondary/10 absolute right-1/4 bottom-20 h-32 w-32 rounded-full blur-xl'
        transition={{ duration: 6, repeat: Infinity }}
      />
    </div>

    <div className='relative z-10 container mx-auto max-w-6xl'>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mb-12 text-center'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
      >
        {/* Page Title */}
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className='bg-secondary/10 text-secondary mb-6 inline-flex items-center rounded-full px-4 py-2'
          initial={{ opacity: 0, scale: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Ban className='mr-2 h-4 w-4' />
          <span className='text-sm'>Revoke Mint Authority</span>
        </motion.div>

        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className='from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent'>Revoke Mint Authority</span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Create a permanently fixed token supply by revoking mint authority. Build ultimate trust with your community and prevent future
          token inflation forever.
        </motion.p>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5'
        initial={{ opacity: 0, y: 30 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className='group'
              initial={{ opacity: 0, y: 20 }}
              key={index}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className='hover:border-secondary/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                <CardContent className='p-6'>
                  <motion.div
                    className='bg-secondary/10 group-hover:bg-secondary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300'
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Icon className='text-secondary h-6 w-6' />
                  </motion.div>
                  <h3 className='group-hover:text-secondary mb-2 font-medium transition-colors duration-300'>{feature.title}</h3>
                  <p className='text-muted-foreground text-sm'>{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Trust Reasons */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='grid grid-cols-1 gap-6 md:grid-cols-3'
        initial={{ opacity: 0, y: 30 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        {trustReasons.map((reason, index) => {
          const Icon = reason.icon
          return (
            <motion.div className='text-center' key={index} whileHover={{ scale: 1.02 }}>
              <Card className='hover:border-primary/30 border-2 transition-all duration-300'>
                <CardContent className='p-6'>
                  <Icon className='text-primary mx-auto mb-3 h-8 w-8' />
                  <h4 className='mb-2 font-medium'>{reason.title}</h4>
                  <p className='text-muted-foreground text-sm'>{reason.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  </section>
)
