'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

export interface FAQ {
  question: string
  answer: string
  category: 'general' | 'technical' | 'security'
}

interface FAQItemProps {
  faq: FAQ
  index: number
  isActive: boolean
  onToggle: () => void
}

export const FAQItem = ({ faq, index, isActive, onToggle }: FAQItemProps): React.ReactNode => (
  <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ delay: 0.1 * index }}>
    <Card className='hover:border-primary/30 overflow-hidden border-2 transition-all duration-300'>
      <CardContent className='p-0'>
        <button
          className='hover:bg-muted/50 flex w-full items-center justify-between p-6 text-left transition-colors'
          onClick={onToggle}
          type='button'
        >
          <div className='flex items-center gap-3'>
            <HelpCircle className='text-primary h-5 w-5 flex-shrink-0' />
            <span className='font-medium'>{faq.question}</span>
          </div>
          {isActive ? <ChevronUp className='text-muted-foreground h-5 w-5' /> : <ChevronDown className='text-muted-foreground h-5 w-5' />}
        </button>
        {isActive && (
          <motion.div animate={{ opacity: 1, height: 'auto' }} initial={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <div className='bg-muted/30 border-t px-6 py-4'>
              <p className='text-muted-foreground leading-relaxed'>{faq.answer}</p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  </motion.div>
)
