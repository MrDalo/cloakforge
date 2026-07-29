import { JsonLd } from './index'

interface SoftwareApplicationJsonLdProps {
  name: string
  description: string
  url: string
}

/**
 * Renders schema.org SoftwareApplication structured data describing a
 * CloakForge tool, so Google rich results and AI assistants can identify
 * what the tool does independent of page copy. Deliberately omits `offers`/
 * pricing — tool fees are configured dynamically via Contentful and would
 * risk going stale in static structured data.
 *
 * @param name - Short tool name (e.g. "Token Creator").
 * @param description - One or two sentence description of what the tool does.
 * @param url - Canonical URL of the tool page.
 * @returns A JSON-LD script tag.
 */
export const SoftwareApplicationJsonLd = ({ name, description, url }: SoftwareApplicationJsonLdProps): React.ReactNode => (
  <JsonLd
    data={{
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `${name} - CloakForge`,
      description,
      url,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      publisher: {
        '@type': 'Organization',
        name: 'CloakForge',
        url: 'https://cloakforge.app',
      },
    }}
  />
)

export default SoftwareApplicationJsonLd
