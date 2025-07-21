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
    question: 'What happens when I burn tokens?',
    answer:
      'When you burn tokens, they are permanently removed from circulation by sending them to an address where they cannot be accessed. This reduces the total supply of your token permanently.',
    category: 'general',
  },
  {
    question: 'Is token burning reversible?',
    answer:
      'No, token burning is completely irreversible. Once tokens are burned, they cannot be recovered or recreated. This is a permanent action that reduces the total supply forever.',
    category: 'security',
  },
  {
    question: 'How much does it cost to burn tokens?',
    answer:
      'The cost includes a small Solana network transaction fee (typically ~0.000005 SOL). There are no additional platform fees for burning tokens.',
    category: 'technical',
  },
  {
    question: 'Why would I want to burn tokens?',
    answer:
      'Token burning is used to reduce total supply, create deflationary pressure, demonstrate commitment to tokenomics, remove excess tokens, or implement buyback and burn mechanisms.',
    category: 'general',
  },
  {
    question: 'Can I burn any token on Solana?',
    answer:
      'You can only burn tokens that you own and control. You must have the tokens in your wallet and the appropriate permissions to burn them.',
    category: 'technical',
  },
  {
    question: 'How do I verify that tokens were actually burned?',
    answer:
      'All burn transactions are recorded on the Solana blockchain and can be verified using block explorers. The burned tokens will show as transferred to a burn address.',
    category: 'security',
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
          Get answers to common questions about token burning and our platform.
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
