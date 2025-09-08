'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { orbitItems } from './heroData'

export const OrbitingVisualization = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, scale: 1 }}
    className='relative'
    initial={{ opacity: 0, scale: 0.8 }}
    transition={{ delay: 0.4, duration: 1 }}
  >
    <div className='relative mx-auto w-full max-w-lg'>
      {/* Central Orbit */}
      <motion.div
        animate={{ rotate: 360 }}
        className='border-primary/30 relative mx-auto h-80 w-80 rounded-full border-4'
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {/* Orbiting Tools */}
        {orbitItems.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              animate={{ rotate: -360 }}
              className='absolute -top-8 left-1/2 -ml-8 h-16 w-16'
              key={index}
              style={{
                transformOrigin: '50% 168px',
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: 'linear',
                delay: item.delay,
              }}
            >
              <motion.div
                className={`h-full w-full rounded-full ${item.color} float-animation group flex items-center justify-center shadow-lg`}
                whileHover={{ scale: 1.1 }}
              >
                <Icon className='h-8 w-8 text-white' />
                <div className='absolute -bottom-8 left-1/2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100'>
                  <div className='bg-card text-card-foreground rounded px-2 py-1 text-xs shadow-lg'>{item.label}</div>
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Center Logo */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        className='absolute inset-0 flex items-center justify-center'
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className='relative size-20 overflow-hidden rounded-2xl shadow-2xl'>
          <Image alt='Crypto Forge' className='h-full w-full rounded-2xl object-cover' fill src='/SolCloak-logo.webp' />
        </div>
      </motion.div>
    </div>
  </motion.div>
)
