'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export const Logo = (): React.ReactNode => (
  <motion.div className='flex items-center space-x-3' transition={{ duration: 0.2 }} whileHover={{ scale: 1.02 }}>
    <Link className='flex items-center space-x-3' href='/'>
      <div className='relative size-10 overflow-hidden rounded-lg'>
        <Image alt='CloakForge' className='h-full w-full object-contain' fill src='/cloakforge-logo-without-rectangle.webp' />
      </div>
      <span className='text-foreground text-xl font-medium'>CloakForge</span>
    </Link>
  </motion.div>
)
