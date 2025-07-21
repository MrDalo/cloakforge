'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormCard } from './FormCard'
import { TokenCreatorFormSchema, type TokenCreatorFormData } from './tokenCreatorFormSchema'

export const TokenCreationForm = (): React.ReactNode => {
  const [isConnected, setIsConnected] = useState(false)

  const form = useForm<TokenCreatorFormData>({
    resolver: zodResolver(TokenCreatorFormSchema),
    defaultValues: {
      name: '',
      symbol: '',
      description: '',
      totalSupply: '',
      decimals: '9',
      revokeMintAuthority: false,
      revokeUpdateAuthority: false,
      website: '',
      twitter: '',
      telegram: '',
      discord: '',
      logo: undefined,
    },
    mode: 'onChange',
  })

  const handleSubmit = (data: TokenCreatorFormData): void => {
    // Handle form submission logic here
    if (isConnected) {
      // Submit to blockchain
      // TODO: Implement token creation logic with data
      void data // Prevent unused variable error until implementation
    }
  }

  return (
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <motion.div
          className='mb-12'
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <FormCard form={form} isConnected={isConnected} onSubmit={handleSubmit} setIsConnected={setIsConnected} />
        </motion.div>
      </div>
    </section>
  )
}
