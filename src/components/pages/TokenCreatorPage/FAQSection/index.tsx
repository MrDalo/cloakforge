'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
  category: 'general' | 'technical' | 'security'
}

const faqs: FAQ[] = [
  {
    question: 'What information do I need to create a token?',
    answer:
      'You need a token name, symbol, description, total supply, and optionally an image/logo. You can also add social media links and additional metadata to make your token more professional.',
    category: 'general',
  },
  {
    question: 'How much does it cost to create a token?',
    answer:
      'Creating a token on Solana costs approximately 0.02 SOL for the token creation plus small network fees (~0.003 SOL). This is significantly cheaper than other blockchains.',
    category: 'technical',
  },
  {
    question: 'Can I modify my token after creation?',
    answer:
      'Some properties like metadata can be updated if you retain update authority. However, core properties like total supply and decimals cannot be changed after creation.',
    category: 'technical',
  },
  {
    question: 'Is it safe to create tokens on your platform?',
    answer:
      'Yes, our platform uses audited smart contracts and follows Solana best practices. Your tokens are created directly on the blockchain with standard SPL token protocols.',
    category: 'security',
  },
  {
    question: 'What is mint authority and should I revoke it?',
    answer:
      'Mint authority allows creating additional tokens. Revoking it makes your token supply fixed forever. This is often done to build trust with holders by ensuring no more tokens can be minted.',
    category: 'security',
  },
  {
    question: 'Can I create tokens on devnet for testing?',
    answer:
      'Absolutely! We support devnet token creation for testing purposes. This allows you to test your token functionality before deploying on mainnet.',
    category: 'technical',
  },
  {
    question: 'What file formats are supported for token images?',
    answer:
      'We support PNG, JPG, and SVG formats. Images should be square (1:1 aspect ratio) and at least 512x512 pixels for best results.',
    category: 'general',
  },
  {
    question: 'How do I add liquidity to my token?',
    answer:
      'After creating your token, you can add liquidity on decentralized exchanges like Raydium or Orca. Our platform also provides tools to help you create liquidity pools.',
    category: 'general',
  },
]

export const FAQSection = (): React.ReactNode => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General' },
    { id: 'technical', label: 'Technical' },
    { id: 'security', label: 'Security' },
  ]

  const filteredFAQs = selectedCategory === 'all' ? faqs : faqs.filter((faq) => faq.category === selectedCategory)

  const toggleFAQ = (index: number): void => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <section className='container mx-auto px-4 py-16'>
      <motion.div animate={{ opacity: 1, y: 0 }} className='text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
        <Badge className='mb-4' variant='outline'>
          FAQ
        </Badge>
        <h2 className='mb-4 text-3xl font-bold md:text-4xl'>Frequently Asked Questions</h2>
        <p className='text-muted-foreground mx-auto mb-8 max-w-2xl text-lg'>
          Get answers to common questions about token creation and our platform.
        </p>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mx-auto max-w-4xl'
        initial={{ opacity: 0, y: 30 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className='mb-8 flex flex-wrap justify-center gap-2'>
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              size='sm'
              variant={selectedCategory === category.id ? 'default' : 'outline'}
            >
              {category.label}
            </Button>
          ))}
        </div>

        <div className='space-y-4'>
          {filteredFAQs.map((faq, index) => (
            <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} key={index} transition={{ delay: 0.1 * index }}>
              <Card className='hover:border-primary/30 overflow-hidden border-2 transition-all duration-300'>
                <CardContent className='p-0'>
                  <button
                    className='hover:bg-muted/50 flex w-full items-center justify-between p-6 text-left transition-colors'
                    onClick={() => toggleFAQ(index)}
                    type='button'
                  >
                    <div className='flex items-center gap-3'>
                      <HelpCircle className='text-primary h-5 w-5 flex-shrink-0' />
                      <span className='font-medium'>{faq.question}</span>
                    </div>
                    {activeIndex === index ? (
                      <ChevronUp className='text-muted-foreground h-5 w-5' />
                    ) : (
                      <ChevronDown className='text-muted-foreground h-5 w-5' />
                    )}
                  </button>
                  {activeIndex === index && (
                    <motion.div animate={{ opacity: 1, height: 'auto' }} initial={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                      <div className='bg-muted/30 border-t px-6 py-4'>
                        <p className='text-muted-foreground leading-relaxed'>{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
