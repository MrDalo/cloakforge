import { NextRequest } from 'next/server'
import { getLogger } from '@/lib/logger/logger'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { AppError } from '@/types/error'
import getServerConfig from '../config/getServerConfig'

/**
 * Privacy-first origin validation for API routes
 * Protects against unauthorized cross-origin requests without storing user data
 */
export async function validateOrigin(req: NextRequest, allowedOrigins?: string[]): Promise<void> {
  const logger = getLogger({
    context: 'security',
    component: 'originValidator',
  })

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
    const isValidOrigin = validOrigins.some((validOrigin) => {
      if (!validOrigin) return false

      // Exact match or subdomain match
      return origin === validOrigin || origin.endsWith(`.${validOrigin.replace(/^https?:\/\//, '')}`)
    })

    if (!isValidOrigin) {
      logger.warn('Request blocked: Invalid origin', {
        origin,
        allowedOrigins: validOrigins,
        // No user-identifying info logged for privacy
      })
      throw new AppError('Request from unauthorized origin', APP_ERROR_CODES.FORBIDDEN, 403)
    }

    return
  }

  // Fallback to referer check (less reliable but better than nothing)
  if (referer) {
    const isValidReferer = validOrigins.some((validOrigin) => {
      if (!validOrigin) return false
      return referer.startsWith(validOrigin)
    })

    if (!isValidReferer) {
      logger.warn('Request blocked: Invalid referer', {
        referer,
        allowedOrigins: validOrigins,
      })
      throw new AppError('Request from unauthorized referer', APP_ERROR_CODES.FORBIDDEN, 403)
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
