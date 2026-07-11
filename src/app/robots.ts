import type { MetadataRoute } from 'next'

const BASE_URL = 'https://cloakforge.app'

/**
 * Generates the robots.txt served at /robots.txt — allows crawling of all
 * public pages, blocks private/non-indexable routes (account, admin, API,
 * preview/test pages), and points crawlers at the sitemap.
 *
 * @returns Robots directives and sitemap location.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/admin', '/api/', '/preview/', '/test'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
