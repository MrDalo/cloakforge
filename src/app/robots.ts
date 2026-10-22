import type { MetadataRoute } from 'next'

const BASE_URL = 'https://cloakforge.app'

/**
 * Generates the robots.txt served at /robots.txt — allows crawling of all
 * public pages, blocks the API, and points crawlers at the sitemap.
 *
 * Private routes (/account, /admin) are intentionally NOT listed: they carry a
 * `noindex` robots meta tag instead, which crawlers can only see if crawling is
 * allowed, and listing them here would only advertise their paths. Debug routes
 * (/test, /preview) return 404 outside development.
 *
 * @returns Robots directives and sitemap location.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
