import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getLogger } from '@/lib/logger/logger'
import type { ApiResponseBase } from '@/types'

const logger = getLogger({ context: 'api', route: '/api/revalidate/contentful' })

/**
 * Contentful Webhook Handler for On-Demand Revalidation
 *
 * This endpoint receives webhooks from Contentful when content changes
 * and immediately revalidates the appropriate cache to propagate changes to the application.
 *
 * Setup in Contentful:
 * 1. Go to Settings > Webhooks
 * 2. Create new webhook
 * 3. URL: https://your-domain.com/api/revalidate/contentful?secret=YOUR_SECRET
 * 4. Triggers: Entry.publish, Entry.unpublish, Entry.delete
 * 5. Filters (optional): Content type = "toolConfiguration" | "blogPost" | "siteBanner"
 *
 * Supported Content Types:
 * - toolConfiguration: Revalidates tool-configs cache tag
 * - blogPost: Revalidates blog-posts cache tag
 * - siteBanner: Revalidates site-banner cache tag
 *
 * Environment Variables Required:
 * - CONTENTFUL_REVALIDATE_SECRET: Secret token for webhook authentication
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook secret for security
    const secret = request.nextUrl.searchParams.get('secret')
    const expectedSecret = process.env.CONTENTFUL_REVALIDATE_SECRET

    if (!expectedSecret) {
      logger.error('CONTENTFUL_REVALIDATE_SECRET not configured')
      return NextResponse.json<ApiResponseBase<null>>(
        {
          status: 'error',
          status_code: 500,
          error_message: 'Webhook secret not configured',
          data: null,
        },
        { status: 500 }
      )
    }

    if (secret !== expectedSecret) {
      logger.warn('Invalid webhook secret received', {
        receivedSecret: secret ? 'present' : 'missing',
      })
      return NextResponse.json<ApiResponseBase<null>>(
        {
          status: 'error',
          status_code: 401,
          error_message: 'Invalid webhook secret',
          data: null,
        },
        { status: 401 }
      )
    }

    // 2. Parse webhook payload
    const payload = await request.json()
    const contentType = payload?.sys?.contentType?.sys?.id
    logger.info('Contentful webhook received', {
      contentType,
      action: payload?.sys?.type,
    })

    // 3. Revalidate appropriate cache tags based on content type
    // Tool configs: Immediate invalidation ({ expire: 0 }) - critical operational changes (fees, enable/disable)
    // Blog posts & site banner: Stale-while-revalidate ('max') - static content updates
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
      revalidateTag('site-banner', 'max') // Stale-while-revalidate for banners
      revalidatedTags.push('site-banner')
    }

    // If no specific content type matched, revalidate all
    if (revalidatedTags.length === 0) {
      revalidateTag('tool-configs', { expire: 0 }) // Immediate for critical tool configs
      revalidateTag('blog-posts', 'max') // Stale-while-revalidate for blog
      revalidateTag('site-banner', 'max') // Stale-while-revalidate for banner
      revalidatedTags.push('tool-configs', 'blog-posts', 'site-banner')
    }

    logger.info('Cache revalidation triggered', {
      tags: revalidatedTags,
      contentType,
      profile: 'max',
      timestamp: new Date().toISOString(),
    })

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
    logger.error('Webhook processing failed', error, {
      url: request.url,
    })

    return NextResponse.json<ApiResponseBase<null>>(
      {
        status: 'error',
        status_code: 500,
        error_message: error instanceof Error ? error.message : 'Webhook processing failed',
        data: null,
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for manual revalidation (testing/debugging)
 *
 * Usage: https://your-domain.com/api/revalidate/contentful?secret=YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret')
    const expectedSecret = process.env.CONTENTFUL_REVALIDATE_SECRET

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json<ApiResponseBase<null>>(
        {
          status: 'error',
          status_code: 401,
          error_message: 'Invalid or missing secret',
          data: null,
        },
        { status: 401 }
      )
    }

    // Manual revalidation - revalidate all content types
    revalidateTag('tool-configs', { expire: 0 }) // Immediate for critical configs
    revalidateTag('blog-posts', 'max') // Stale-while-revalidate for blog
    revalidateTag('site-banner', 'max') // Stale-while-revalidate for banner

    logger.info('Manual cache revalidation triggered', {
      tags: ['tool-configs', 'blog-posts', 'site-banner'],
      timestamp: new Date().toISOString(),
    })

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
    logger.error('Manual revalidation failed', error)

    return NextResponse.json<ApiResponseBase<null>>(
      {
        status: 'error',
        status_code: 500,
        error_message: error instanceof Error ? error.message : 'Revalidation failed',
        data: null,
      },
      { status: 500 }
    )
  }
}
