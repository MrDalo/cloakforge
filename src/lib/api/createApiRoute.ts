import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { type z } from 'zod'
import { AppError, handleError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import { validateRequestBody } from '@/lib/utils/validateRequestBody'
import type { ApiResponseBase } from '@/types'

/**
 * Configuration for API route wrapper
 */
interface ApiRouteConfig<TInput, TOutput> {
  /** Route name for logging (e.g., 'burn-tokens', 'token-creator') */
  name: string

  /** Zod schema for input validation */
  schema: z.ZodSchema<TInput>

  /** Handler function that processes the validated data */
  handler: (data: TInput, request: NextRequest) => Promise<TOutput>

  /** HTTP method (default: 'POST') */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
}

/**
 * Creates a standardized API route handler with:
 * - Request body validation
 * - Error handling
 * - Structured logging
 * - Consistent response format
 *
 * @example
 * ```typescript
 * export const POST = createApiRoute({
 *   name: 'burn-tokens',
 *   schema: burnTokensRequestSchema,
 *   handler: async (data) => {
 *     return await burnToken(data)
 *   }
 * })
 * ```
 */
export function createApiRoute<TInput, TOutput>(
  config: ApiRouteConfig<TInput, TOutput>
): (request: NextRequest) => Promise<NextResponse<ApiResponseBase<TOutput>>> {
  const { name, schema, handler, method = 'POST' } = config

  return async (request: NextRequest): Promise<NextResponse<ApiResponseBase<TOutput>>> => {
    // Mark route as dynamic (Next.js 16 + cacheComponents compatibility)
    await headers()

    const logger = getLogger({
      context: 'api',
      route: `/api/${name}`,
      method,
    })

    try {
      // 1. Parse request body (skip for GET requests)
      let body: unknown
      if (method !== 'GET') {
        body = await request.json()
      }

      // 2. Validate request body
      const validation = validateRequestBody(body || {}, schema)
      if (!validation.success) {
        return NextResponse.json(
          {
            status: 'error',
            status_code: 400,
            error_message: `Validation failed: ${validation.errors}`,
            data: null,
          },
          { status: 400 }
        )
      }

      // 3. Execute handler
      const result = await handler(validation.data, request)

      // 4. Return success response
      return NextResponse.json({
        status: 'success',
        status_code: 200,
        error_message: '',
        data: result,
      })
    } catch (error: unknown) {
      // 5. Handle errors uniformly
      logger.error('API error', error, {
        route: `/api/${name}`,
      })

      // Handle known AppError instances
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            status: 'error',
            status_code: error.status,
            error_message: error.message,
            data: null,
          },
          { status: error.status }
        )
      }

      // Handle unknown errors
      const userFriendlyMessage = handleError(error)
      const statusCode = 500

      return NextResponse.json(
        {
          status: 'error',
          status_code: statusCode,
          error_message: userFriendlyMessage,
          data: null,
        },
        { status: statusCode }
      )
    }
  }
}
