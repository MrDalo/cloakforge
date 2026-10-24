import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { ERROR_MESSAGES } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import type { ApiResponseBase } from '@/types'

const logger = getLogger({ context: 'api', route: '/api/revalidate/contentful' })

/** Header carrying the shared webhook secret (configure as a Contentful "secret header"). */
const WEBHOOK_SECRET_HEADER = 'x-webhook-secret'

/**
 * Contentful Webhook Handler for On-Demand Revalidation
 *
 * This endpoint receives webhooks from Contentful when content changes
 * and immediately revalidates the appropriate cache to propagate changes to the application.
 *
 * Setup in Contentful:
 * 1. Go to Settings > Webhooks
 * 2. Create new webhook (method POST)
 * 3. URL: https://your-domain.com/api/revalidate/contentful  (no secret in the URL)
 * 4. Headers > Add secret header: `x-webhook-secret: YOUR_SECRET`
 *    (`Authorization: Bearer YOUR_SECRET` is also accepted)
 * 5. Triggers: Entry.publish, Entry.unpublish, Entry.delete
 * 6. Filters (optional): Content type = "toolConfiguration" | "blogPost" | "siteBanner"
 *
 * Supported Content Types:
 * - toolConfiguration: Revalidates tool-configs cache tag
 * - blogPost: Revalidates blog-posts cache tag
 * - siteBanner: Revalidates site-banner cache tag
 *
 * Only POST is exported; Next.js answers other methods with 405.
 *
 * Environment Variables Required:
 * - CONTENTFUL_REVALIDATE_SECRET: Secret token for webhook authentication (fails closed when unset)
 */

const errorResponse = (status: number, message: string) =>
  NextResponse.json<ApiResponseBase<null>>(
    {
      status: 'error',
      status_code: status,
      error_message: message,
      data: null,
    },
    { status }
  )

/** Reads the secret from `x-webhook-secret`, falling back to `Authorization: Bearer <secret>`. */
const getProvidedSecret = (request: NextRequest): string | null => {
  const headerSecret = request.headers.get(WEBHOOK_SECRET_HEADER)?.trim()
  if (headerSecret) return headerSecret

  const bearer = request.headers
    .get('authorization')
    ?.match(/^Bearer\s+(.+)$/i)?.[1]
    ?.trim()
  return bearer || null
}

/** Constant-time comparison; hashing first makes it length-safe and hides the expected length. */
const secretsMatch = (provided: string, expected: string): boolean => {
  const providedDigest = createHash('sha256').update(provided).digest()
  const expectedDigest = createHash('sha256').update(expected).digest()
  return timingSafeEqual(providedDigest, expectedDigest)
}

type ContentfulWebhookPayload = {
  sys?: { contentType?: { sys?: { id?: unknown } } }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook secret (fail closed when not configured)
    const expectedSecret = process.env.CONTENTFUL_REVALIDATE_SECRET?.trim()

    if (!expectedSecret) {
      logger.error('CONTENTFUL_REVALIDATE_SECRET not configured')
      return errorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR)
    }

    const providedSecret = getProvidedSecret(request)
    if (!providedSecret || !secretsMatch(providedSecret, expectedSecret)) {
      logger.warn('Rejected webhook with missing or invalid secret')
      return errorResponse(401, ERROR_MESSAGES.UNAUTHORIZED)
    }

    // 2. Parse webhook payload (only after authentication)
    let payload: ContentfulWebhookPayload | null
    try {
      payload = (await request.json()) as ContentfulWebhookPayload | null
    } catch {
      return errorResponse(400, ERROR_MESSAGES.INVALID_JSON)
    }
    const contentType = payload?.sys?.contentType?.sys?.id

    // 3. Revalidate appropriate cache tags based on content type
    // Tool configs: Immediate invalidation ({ expire: 0 }) - critical operational changes (fees, enable/disable)
    // Site banner: immediate too, so a published/unpublished banner shows on the next request
    // Blog posts: Stale-while-revalidate ('max') - static content updates
    const revalidatedTags: string[] = []

    if (contentType === 'toolConfiguration') {
      revalidateTag('tool-configs', { expire: 0 }) // Immediate expiration for critical config changes
      revalidatedTags.push('tool-configs')
    }

    if (contentType === 'blogPost') {
      revalidateTag('blog-posts', 'max') // Stale-while-revalidate for blog content
      revalidatedTags.push('blog-posts')
    }

    if (contentType === 'siteBanner') {
      revalidateTag('site-banner', { expire: 0 }) // Immediate: editors expect the banner change on the next load
      revalidatedTags.push('site-banner')
    }

    // If no specific content type matched, revalidate all
    if (revalidatedTags.length === 0) {
      revalidateTag('tool-configs', { expire: 0 }) // Immediate for critical tool configs
      revalidateTag('blog-posts', 'max') // Stale-while-revalidate for blog
      revalidateTag('site-banner', { expire: 0 }) // Immediate for the banner
      revalidatedTags.push('tool-configs', 'blog-posts', 'site-banner')
    }

    // 4. Return success response
    return NextResponse.json<ApiResponseBase<{ revalidated: boolean; timestamp: number }>>(
      {
        status: 'success',
        status_code: 200,
        error_message: '',
        data: {
          revalidated: true,
          timestamp: Date.now(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    // Details stay in server logs; the response is generic
    logger.error('Webhook processing failed', error)
    return errorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR)
  }
}
