'use client'

import { motion } from 'framer-motion'
import { faqData } from '../tokenCreatorData'
import FAQItem from './FAQItem'

export const FAQSection = (): React.ReactNode => (
  <section className='px-6 py-16'>
    <div className='container mx-auto max-w-4xl'>
      <motion.div
        className='mb-12 text-center'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2 className='mb-4 text-3xl font-bold'>Frequently Asked Questions</h2>
        <p className='text-muted-foreground text-xl'>Get answers to common questions about token creation</p>
      </motion.div>
      <div className='space-y-4'>
        {faqData.map((faq, index) => (
          <FAQItem key={`faq-${index}`} {...faq} index={index} />
        ))}
      </div>
    </div>
  </section>
)
