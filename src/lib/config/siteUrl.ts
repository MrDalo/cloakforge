/**
 * Canonical site origin (M8).
 *
 * Production serves `https://www.cloakforge.app`; the apex domain only redirects there. Every absolute
 * URL the app emits for crawlers (metadataBase, robots.txt, sitemap) is built from this single origin.
 * `NEXT_PUBLIC_SITE_URL` overrides it (inlined at build time); production runtimes reject a malformed
 * value at boot (src/lib/config/env.ts).
 *
 * Client-safe: no secrets, no 'server-only'.
 */

export const DEFAULT_SITE_URL = 'https://www.cloakforge.app'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Normalizes a site URL candidate to its origin (scheme + host + optional port).
 *
 * Only `https:` is accepted, except plain `http:` for localhost development. Paths, query strings,
 * fragments and credentials are not allowed, so a typo cannot silently shift every canonical URL.
 *
 * @param value - Candidate URL, e.g. `https://www.cloakforge.app` (a trailing slash is fine).
 * @returns The origin without a trailing slash, or null when the value is missing or not a bare origin.
 */
export const normalizeSiteUrl = (value: string | undefined): string | null => {
  const candidate = value?.trim()
  if (!candidate) return null

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }

  const isHttps = url.protocol === 'https:'
  const isLocalHttp = url.protocol === 'http:' && LOCAL_HOSTNAMES.has(url.hostname)
  const isBareOrigin = url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password

  return (isHttps || isLocalHttp) && isBareOrigin ? url.origin : null
}

/**
 * Resolves the canonical site origin.
 *
 * @param value - Override, defaults to `NEXT_PUBLIC_SITE_URL`.
 * @returns The configured origin when valid, otherwise {@link DEFAULT_SITE_URL}.
 */
export const getSiteUrl = (value: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string =>
  normalizeSiteUrl(value) ?? DEFAULT_SITE_URL

/**
 * Builds an absolute URL on the canonical origin.
 *
 * @param path - Absolute path such as `/blog` (empty string for the homepage).
 * @returns Absolute URL, e.g. `https://www.cloakforge.app/blog`.
 */
export const toSiteUrl = (path: string): string => `${getSiteUrl()}${path}`
