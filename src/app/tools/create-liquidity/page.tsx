'use client'

import { motion } from 'framer-motion'
import { Droplets, ArrowLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

const CreateLiquidityPage = (): React.ReactNode => (
  <div className='bg-background min-h-screen px-6 py-16'>
    <div className='container mx-auto max-w-4xl'>
      <motion.div animate={{ opacity: 1, y: 0 }} className='text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
        {/* Back Button */}
        <div className='mb-8'>
          <Link href='/'>
            <Button className='flex items-center space-x-2' variant='ghost'>
              <ArrowLeft className='h-4 w-4' />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>

        <Card className='border-border bg-card mx-auto max-w-2xl border-2 shadow-xl'>
          <CardContent className='p-12 text-center'>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              className='bg-secondary/10 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl'
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Droplets className='text-secondary h-12 w-12' />
            </motion.div>

            <h1 className='crypto-text-gradient mb-4 text-3xl md:text-4xl'>Create Liquidity</h1>

            <p className='text-muted-foreground mb-8 text-lg leading-relaxed'>
              This tool is currently in development. Soon you'll be able to add liquidity to DEXs and create trading pairs with optimized
              routing and minimal slippage.
            </p>

            <div className='text-primary mb-8 flex items-center justify-center space-x-2'>
              <Clock className='h-5 w-5' />
              <span className='font-medium'>Coming Soon</span>
            </div>

            <div className='space-y-4'>
              <a href='/tools/token-creator'>
                <Button className='bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto'>
                  Try Token Creator Instead
                </Button>
              </a>

              <div className='text-muted-foreground text-sm'>
                or{' '}
                <Link className='text-primary hover:underline' href='/'>
                  return to homepage
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </div>
)

export default CreateLiquidityPage
