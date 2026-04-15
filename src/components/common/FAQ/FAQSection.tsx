'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { FAQItem, type FAQ } from './FAQItem'
import { CategoryFilter } from './CategoryFilter'

interface FAQSectionProps {
  title?: string
  subtitle?: string
  faqs: FAQ[]
}

export const FAQSection = ({
  title = 'Frequently Asked Questions',
  subtitle = 'Get answers to common questions about our platform.',
  faqs,
}: FAQSectionProps): React.ReactNode => {
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
      <motion.div animate={{ opacity: 1, y: 0 }} className='text-center' initial={false} transition={{ duration: 0.8 }}>
        <Badge className='mb-4' variant='outline'>
          FAQ
        </Badge>
        <h2 className='mb-4 text-3xl md:text-4xl'>{title}</h2>
        <p className='text-muted-foreground mx-auto mb-8 max-w-2xl text-lg'>{subtitle}</p>
      </motion.div>

      <motion.div animate={{ opacity: 1, y: 0 }} className='mx-auto max-w-4xl' initial={false} transition={{ delay: 0.2, duration: 0.8 }}>
        <CategoryFilter categories={categories} onCategoryChange={setSelectedCategory} selectedCategory={selectedCategory} />

        <div className='space-y-2'>
          {filteredFAQs.map((faq, index) => (
            <FAQItem faq={faq} index={index} isActive={activeIndex === index} key={index} onToggle={() => toggleFAQ(index)} />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
