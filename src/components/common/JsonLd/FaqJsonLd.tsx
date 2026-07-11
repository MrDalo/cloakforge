import { JsonLd } from './index'

interface FaqEntry {
  question: string
  answer: string
}

interface FaqJsonLdProps {
  faqs: FaqEntry[]
}

/**
 * Renders schema.org FAQPage structured data from a tool page's existing FAQ
 * content, making it eligible for Google's FAQ rich results without any
 * duplicate content — reuses the same data the visible FAQ section renders.
 *
 * @param faqs - The tool's FAQ entries (question/answer pairs).
 * @returns A JSON-LD script tag, or nothing if there are no FAQ entries.
 */
export const FaqJsonLd = ({ faqs }: FaqJsonLdProps): React.ReactNode => {
  if (faqs.length === 0) return null

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }}
    />
  )
}

export default FaqJsonLd
