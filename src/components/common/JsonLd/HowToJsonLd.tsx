import { JsonLd } from './index'

export interface HowToStep {
  name: string
  text: string
}

interface HowToJsonLdProps {
  name: string
  description: string
  steps: HowToStep[]
}

/**
 * Renders schema.org HowTo structured data describing a tool's step-by-step
 * flow, so AI assistants and Google can answer "how do I X on CloakForge"
 * queries with an accurate, structured sequence instead of parsing page copy.
 *
 * @param name - HowTo title (e.g. "How to Create a Solana Token").
 * @param description - One or two sentence summary of the overall task.
 * @param steps - Ordered steps a user takes to complete the task.
 * @returns A JSON-LD script tag.
 */
export const HowToJsonLd = ({ name, description, steps }: HowToJsonLdProps): React.ReactNode => (
  <JsonLd
    data={{
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name,
      description,
      step: steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
    }}
  />
)

export default HowToJsonLd
