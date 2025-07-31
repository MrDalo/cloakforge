import { NextRequest, NextResponse } from 'next/server'
import { getLogger } from '@/lib/logger/logger'

// Create logger for API security
const logger = getLogger({
  context: 'api',
  component: 'tool-configs',
})

// Helper to get client IP from request
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfIP) {
    return cfIP
  }
  return 'unknown'
}

// SECURITY: This endpoint is disabled for public access
// Tool configurations are now provided server-side only through the layout
export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientIP = getClientIP(request)

  // Log unauthorized access attempt
  logger.warn('Unauthorized API access attempt blocked', {
    endpoint: '/api/tool-configs',
    ip: clientIP,
    origin: request.headers.get('origin'),
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
    reason: 'endpoint_disabled',
  })

  return NextResponse.json(
    {
      error: 'This endpoint has been disabled for security reasons.',
      message: 'Tool configurations are provided server-side only.',
    },
    { status: 403 }
  )
}

// For admin access only (require proper authentication)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIP = getClientIP(request)

  try {
    // Check for admin token
    const adminToken = request.headers.get('x-admin-token')
    const authHeader = request.headers.get('authorization')

    if (!adminToken && !authHeader) {
      logger.warn('Admin API access denied - no auth token', {
        ip: clientIP,
        endpoint: '/api/tool-configs',
      })

      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify admin token (use environment variable)
    const validToken = process.env.ADMIN_API_TOKEN
    if (!validToken || (adminToken !== validToken && authHeader !== `Bearer ${validToken}`)) {
      logger.warn('Admin API access denied - invalid token', {
        ip: clientIP,
        endpoint: '/api/tool-configs',
      })

      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 403 })
    }

    // Admin access granted - return cache clear success
    logger.info('Admin tool config cache cleared', {
      ip: clientIP,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Cache refresh triggered. Changes will propagate within 5 minutes.',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Admin API error', error, {
      ip: clientIP,
      operation: 'POST_tool_configs',
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
