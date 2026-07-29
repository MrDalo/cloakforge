import type { MetadataRoute } from 'next'
import { getBlogPosts } from '@/lib/contentful/client'

const BASE_URL = 'https://cloakforge.app'

const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }> = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/tools', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/tools/token-creator', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/transaction-multisender', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/burn-tokens', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/revoke-mint-authority', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/revoke-freeze-authority', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/revoke-metadata-authority', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/update-metadata', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/freeze-wallets', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/unfreeze-wallets', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/token-auditor', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/tools/liquidity-provider', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.7 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/imprint', changeFrequency: 'yearly', priority: 0.2 },
]

/**
 * Generates the sitemap served at /sitemap.xml, combining static tool/marketing
 * routes with dynamic blog post URLs from Contentful so Google can discover and
 * crawl every public page.
 *
 * @returns Sitemap entries for all indexable routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts().catch(() => [])

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...blogEntries]
}
