'use client'

import { ArrowRight, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { features } from '../liquidityProviderData'

const StatusIndicator = ({ color, label }: { color: string; label: string }) => (
  <span className='flex items-center'>
    <div className={`mr-2 h-2 w-2 rounded-full ${color}`} />
    {label}
  </span>
)

export const HeroSection = (): React.ReactNode => {
  const scrollToForm = (): void => {
    const form = document.getElementById('liquidity-provider-form')
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className='dark:via-background relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-950/20 dark:to-emerald-950/20'>
      <div className='container mx-auto px-4 py-16 sm:py-24'>
        {/* Header */}
        <div className='text-center'>
          <Badge className='mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' variant='secondary'>
            <Droplets className='mr-1 h-3 w-3' />
            Raydium Integration
          </Badge>

          <h1 className='mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white'>
            Professional
            <span className='bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent'> Liquidity </span>
            Provider
          </h1>

          <p className='mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
            Create CPMM and CLMM liquidity pools on Raydium with advanced features, smart validation, and professional-grade tools. Direct
            SDK integration for optimal performance and reliability.
          </p>

          <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Button className='bg-emerald-600 text-white hover:bg-emerald-700' onClick={scrollToForm} size='lg'>
              Create Pool Now
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>

            <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
              <StatusIndicator color='bg-green-500' label='CPMM & CLMM Support' />
              <StatusIndicator color='bg-blue-500' label='Raydium SDK v2' />
            </div>
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
}
