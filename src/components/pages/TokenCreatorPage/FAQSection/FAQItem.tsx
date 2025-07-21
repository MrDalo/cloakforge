'use client'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FAQItemProps {
  question: string
  answer: string
  index: number
}

const FAQItem = ({ question, answer, index }: FAQItemProps): React.ReactNode => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <Card className='border-border hover:border-primary/50 transition-colors'>
        <CardContent className='p-0'>
          <button className='flex w-full items-center justify-between p-6 text-left' onClick={() => setIsOpen(!isOpen)} type='button'>
            <h3 className='text-lg font-semibold'>{question}</h3>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
            <div className='px-6 pb-6'>
              <p className='text-muted-foreground'>{answer}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default FAQItem
