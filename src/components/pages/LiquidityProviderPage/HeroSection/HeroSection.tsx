'use client'

import { Droplets } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { features } from '../liquidityProviderData'
import { motion } from 'framer-motion'

const StatusIndicator = ({ color, label }: { color: string; label: string }) => (
  <span className='flex items-center'>
    <div className={`mr-2 h-2 w-2 rounded-full ${color}`} />
    {label}
  </span>
)

export const HeroSection = (): React.ReactNode => (
  <section className='dark:via-background after:to-background relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-24 after:bg-gradient-to-b after:from-transparent dark:from-emerald-950/20 dark:to-emerald-950/20'>
    <div className='container mx-auto px-4 py-16 sm:py-24'>
      {/* Header */}
      <div className='text-center'>
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className='mb-6 inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
          initial={{ opacity: 0, scale: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Droplets className='mr-2 h-4 w-4' />
          <span className='text-sm'>Raydium Integration</span>
        </motion.div>

        <h1 className='mb-6 text-4xl tracking-tight text-gray-900 sm:text-6xl dark:text-white'>
          Professional
          <span className='bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent'> Liquidity </span>
          Provider
        </h1>

        <p className='mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
          Create CPMM and CLMM liquidity pools on Raydium with advanced features, smart validation, and professional-grade tools. Direct SDK
          integration for optimal performance and reliability.
        </p>

        <div className='flex flex-col items-center justify-center gap-4 text-sm text-gray-600 sm:flex-row dark:text-gray-400'>
          <StatusIndicator color='bg-green-500' label='CPMM & CLMM Support' />
        </div>
      </div>

      {/* Features Grid */}
      <div className='mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {features.map((feature, index) => (
          <Card className='border-emerald-200 bg-white/50 backdrop-blur dark:border-emerald-800 dark:bg-gray-900/50' key={index}>
            <CardContent className='p-6'>
              <div className='flex items-start space-x-4'>
                <div className='rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/20'>
                  <feature.icon className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 dark:text-white'>{feature.title}</h3>
                  <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
)
