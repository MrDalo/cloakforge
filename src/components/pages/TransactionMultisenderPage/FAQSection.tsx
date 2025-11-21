'use client'

import { FAQSection as CommonFAQSection } from '@/components/common/FAQ'
import { type FAQ } from '@/components/common/FAQ/FAQItem'

const faqItems: FAQ[] = [
  {
    question: 'How many recipients can I send to at once?',
    answer:
      'Our tool automatically batches your recipients into optimal transaction sizes. You can input as many recipients as you need, and we will handle the batching for you.',
    category: 'general',
  },
  {
    question: 'What tokens can I send?',
    answer: 'You can send SOL and any SPL token (including Token-2022 tokens) that you hold in your wallet.',
    category: 'technical',
  },
  {
    question: 'How are fees calculated?',
    answer:
      'There is a small service fee per batch transaction, plus the standard Solana network fees. The total cost is displayed in the Fee Breakdown section before you confirm.',
    category: 'general',
  },
  {
    question: 'Is it safe?',
    answer:
      'Yes. The tool builds the transaction for you to sign. We never have access to your private keys or funds. You can verify every transaction in your wallet before signing.',
    category: 'security',
  },
]

export const FAQSection = () => <CommonFAQSection faqs={faqItems} title='Frequently Asked Questions' />
