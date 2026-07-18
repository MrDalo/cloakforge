'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { InstagramLogo } from '@/components/common/InstagramLogo'
import { XLogo } from '@/components/common/XLogo'
import { socialLinks } from './footerData'

export const FooterBrand = (): React.ReactNode => (
  <motion.div initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.6 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
    <div className='mb-6 flex items-center'>
      <div className='relative mr-3 flex size-10 items-center justify-center overflow-hidden rounded-lg'>
        <Image alt='CloakForge' className='h-full w-full object-contain' fill sizes='40px' src='/cloakforge-logo-without-rectangle.webp' />
      </div>
      <span className='text-xl'>CloakForge</span>
    </div>
    <p className='text-muted-foreground mb-6 leading-relaxed'>
      Professional Solana token management tools built for developers, creators, and projects.
    </p>

    <div className='flex space-x-4'>
      {socialLinks.map((social) => (
        <motion.a
          className='bg-muted hover:bg-primary hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300'
          href={social.href}
          key={social.name}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {social.icon === 'XLogo' && <XLogo size='md' />}
          {social.icon === 'InstagramLogo' && <InstagramLogo size='md' />}
          {social.icon !== 'XLogo' && social.icon !== 'InstagramLogo' && <social.icon className='h-5 w-5' />}
        </motion.a>
      ))}
    </div>
  </motion.div>
)
