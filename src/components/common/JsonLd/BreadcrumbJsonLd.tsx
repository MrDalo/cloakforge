import { JsonLd } from './index'

export interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

/**
 * Renders schema.org BreadcrumbList structured data describing a page's
 * position in the site hierarchy, for Google's breadcrumb rich results and
 * clearer site-structure understanding by AI crawlers.
 *
 * @param items - Ordered breadcrumb trail from the homepage to the current page.
 * @returns A JSON-LD script tag.
 */
export const BreadcrumbJsonLd = ({ items }: BreadcrumbJsonLdProps): React.ReactNode => (
  <JsonLd
    data={{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    }}
  />
)

export default BreadcrumbJsonLd
