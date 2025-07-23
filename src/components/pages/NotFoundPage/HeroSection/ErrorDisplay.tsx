'use client'

import { motion } from 'framer-motion'
import { FloatingElements } from './FloatingElements'

export const ErrorDisplay = (): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
    {/* Simple 404 Display */}
    <div className='relative mb-12'>
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className='relative inline-block'
        initial={{ opacity: 0, scale: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {/* Clean 404 Number Display */}
        <span className='crypto-text-gradient mb-4 block text-8xl leading-none font-bold md:text-9xl lg:text-[12rem]'>404</span>

        <FloatingElements />
      </motion.div>
    </div>
    {/* Main Heading */}
    <motion.h1
      animate={{ opacity: 1, y: 0 }}
      className='mb-6 text-4xl leading-tight md:text-5xl lg:text-6xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    >
      <span className='from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent'>Oops! Page Not Found</span>
    </motion.h1>
    {/* Subtitle */}
    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className='text-muted-foreground mx-auto mb-12 max-w-2xl text-lg md:text-xl'
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.6, duration: 0.8 }}
    >
      The page you&apos;re looking for seems to have vanished into the blockchain. Don&apos;t worry, your crypto journey continues here.
    </motion.p>
  </motion.div>
)
