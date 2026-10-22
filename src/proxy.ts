import { type NextRequest, NextResponse } from 'next/server'
import { GEO_COUNTRY_HEADER, GEO_REGION_HEADER, isBlockedLocation } from '@/lib/compliance/sanctions'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'proxy', component: 'geoBlock' })

/** Where blocked visitors of tool pages land (static, noindex, no tracking). */
export const UNAVAILABLE_PATH = '/unavailable'

const BLOCKED_MESSAGE = 'This service is not available in your region.'

/**
 * Geo-block for sanctioned jurisdictions (see src/lib/compliance/sanctions.ts for the legal basis).
 *
 * Applies only to the paid-service surface (see `config.matcher`): `/tools/*` redirects to a static notice,
 * the `/api/solana|ipfs|discount-coupon` routes answer 451. Home, legal pages and blog stay reachable so
 * the terms and imprint can still be read. Missing geo headers (local dev, non-Vercel hosts) are allowed.
 * Security headers (CSP, HSTS, ...) are set in next.config.ts, not here.
 *
 * Privacy: IP addresses are never read or logged; a block logs only the country code and route.
 */
export function proxy(request: NextRequest): NextResponse {
  const country = request.headers.get(GEO_COUNTRY_HEADER)
  const region = request.headers.get(GEO_REGION_HEADER)

  if (!isBlockedLocation(country, region)) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  logger.warn('Request blocked by sanctions geo-block', undefined, { country: country?.toUpperCase(), route: pathname })

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { status: 'error', status_code: 451, error_message: BLOCKED_MESSAGE, error_code: 'REGION_BLOCKED', data: null },
      { status: 451, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const redirect = NextResponse.redirect(new URL(UNAVAILABLE_PATH, request.url))
  redirect.headers.set('Cache-Control', 'no-store')
  return redirect
}

export const config = {
  // Paid-service surface only; never runs on static assets, legal pages, home or blog.
  matcher: ['/tools/:path*', '/api/solana/:path*', '/api/ipfs/:path*', '/api/discount-coupon/:path*'],
}
