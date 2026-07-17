import { type NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import getServerConfig from '../config/getServerConfig'

/** Exact match or subdomain match against a configured origin (e.g. `www.example.com` matches `example.com`). */
const isMatchingOrigin = (candidate: string, validOrigin: string): boolean =>
  candidate === validOrigin || candidate.endsWith(`.${validOrigin.replace(/^https?:\/\//, '')}`)

/**
 * Privacy-first origin validation for API routes
 * Protects against unauthorized  cross-origin requests without storing user data
 */
export async function validateOrigin(req: NextRequest, allowedOrigins?: string[]): Promise<void> {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const serverConfig = getServerConfig()

  // Default allowed origins - configure these for your deployment domains
  const defaultAllowedOrigins = [serverConfig.vercelPublicUrl, serverConfig.appUrl].filter(Boolean) as string[]

  const validOrigins = [...(allowedOrigins || []), ...defaultAllowedOrigins]

  // Allow requests without origin/referer (direct API calls, mobile apps, Postman, etc.)
  if (!origin && !referer) {
    return
  }

  // Check origin first (most reliable)
  if (origin) {
    const isValidOrigin = validOrigins.some((validOrigin) => Boolean(validOrigin) && isMatchingOrigin(origin, validOrigin))

    if (!isValidOrigin) {
      throw new AppError('FORBIDDEN', 'Request from unauthorized origin', 403)
    }

    return
  }

  // Fallback to referer check (less reliable but better than nothing)
  if (referer) {
    let refererOrigin: string

    try {
      refererOrigin = new URL(referer).origin
    } catch {
      throw new AppError('FORBIDDEN', 'Request from unauthorized referer', 403)
    }

    const isValidReferer = validOrigins.some((validOrigin) => Boolean(validOrigin) && isMatchingOrigin(refererOrigin, validOrigin))

    if (!isValidReferer) {
      throw new AppError('FORBIDDEN', 'Request from unauthorized referer', 403)
    }

    return
  }
}

/**
 * Check if request is from localhost (for development)
 */
export function isLocalhost(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')

  return (
    origin?.includes('localhost') || origin?.includes('127.0.0.1') || host?.includes('localhost') || host?.includes('127.0.0.1') || false
  )
}

/**
 * Simple origin-only security validation
 */
export async function validateSecurity(
  req: NextRequest,
  options: {
    allowedOrigins?: string[]
    skipForLocalhost?: boolean
  } = {}
): Promise<void> {
  const { allowedOrigins, skipForLocalhost = true } = options

  // Skip validation for localhost in development
  if (skipForLocalhost && isLocalhost(req) && process.env.NODE_ENV === 'development') {
    return
  }

  // Only origin validation (no rate limiting, no API keys)
  await validateOrigin(req, allowedOrigins)
}
