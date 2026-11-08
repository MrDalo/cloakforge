'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { PenOff, DollarSign, Shield, Sparkles, Eye, Code, Users, Globe } from 'lucide-react'

const features = [
  {
    icon: DollarSign,
    title: 'Low, transparent fees',
    description: 'Just 0.1 SOL platform fee + network costs',
  },
  {
    icon: Shield,
    title: 'Build ultimate trust',
    description: "Permanently lock your token's name, symbol, and image forever",
  },
  {
    icon: Sparkles,
    title: 'Instant execution',
    description: 'Revoke metadata authority in a single transaction',
  },
  {
    icon: Eye,
    title: 'Privacy-first: no tracking',
    description: 'No account needed, no analytics, no ad trackers',
  },
  {
    icon: Code,
    title: 'Authority validation',
    description: 'Verify metadata update authority ownership before revocation',
  },
]

const trustReasons = [
  {
    icon: Users,
    title: 'Community Confidence',
    description: 'Show your community your token identity can never be swapped or altered',
  },
  {
    icon: Globe,
    title: 'Anti Rug-Pull',
    description: 'Permanently prevent malicious metadata changes, such as fake name or image swaps',
  },
]

export const HeroSection = (): React.ReactNode => (
  <section className='from-secondary/5 to-secondary/5 after:to-background dark:from-secondary/10 dark:via-background dark:to-secondary/10 relative overflow-hidden bg-gradient-to-br via-white px-6 py-16 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-24 after:bg-gradient-to-b after:from-transparent md:py-20'>
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
        <PenOff className='text-secondary/40 h-6 w-6' />
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
          <PenOff className='mr-2 h-4 w-4' />
          <span className='text-sm'>Revoke Metadata Authority</span>
        </motion.div>

        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className='mb-6 text-3xl leading-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Revoke <span className='text-secondary'>Metadata</span> Authority
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Permanently lock your token&apos;s on-chain metadata — name, symbol, and image URI — by revoking the metadata update authority.
          Build ultimate trust with your community and prevent malicious metadata swaps forever.
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
        className='mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2'
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
