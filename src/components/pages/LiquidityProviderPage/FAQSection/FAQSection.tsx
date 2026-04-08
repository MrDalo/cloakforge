'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { liquidityProviderFAQ } from './faqData'

export const FAQSection = (): React.ReactNode => {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number): void => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <section className='bg-gray-50 py-16 dark:bg-gray-900/50'>
      <div className='container mx-auto px-4'>
        <div className='mb-12 text-center'>
          <div className='mb-4 flex items-center justify-center'>
            <HelpCircle className='h-8 w-8 text-emerald-600 dark:text-emerald-400' />
          </div>
          <h2 className='text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white'>Frequently Asked Questions</h2>
          <p className='mt-4 text-lg text-gray-600 dark:text-gray-300'>
            Everything you need to know about creating liquidity pools on Raydium
          </p>
        </div>

        <div className='mx-auto max-w-3xl'>
          {liquidityProviderFAQ.map((faq, index) => (
            <Card className='mb-4' key={index}>
              <CardHeader className='flex cursor-pointer flex-row items-center justify-between py-4' onClick={() => toggleItem(index)}>
                <CardTitle className='text-left text-lg font-medium'>{faq.question}</CardTitle>
                {openItems.includes(index) ? (
                  <ChevronUp className='h-5 w-5 text-emerald-600' />
                ) : (
                  <ChevronDown className='h-5 w-5 text-emerald-600' />
                )}
              </CardHeader>
              {openItems.includes(index) && (
                <CardContent className='pt-0'>
                  <p className='text-gray-600 dark:text-gray-300'>{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
