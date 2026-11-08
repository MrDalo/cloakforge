import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { type z } from 'zod'
import { AppError, handleServerError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import { validateRequestBody } from '@/lib/utils/validateRequestBody'
import type { ApiResponseBase } from '@/types'

/** Default cap for JSON request bodies: 1 MB. */
export const DEFAULT_MAX_BODY_BYTES = 1024 * 1024

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

  /** Maximum JSON body size in bytes (default: DEFAULT_MAX_BODY_BYTES). Larger bodies get 413. */
  maxBodyBytes?: number
}

const payloadTooLarge = (maxBytes: number): AppError =>
  new AppError('PAYLOAD_TOO_LARGE', `Request body is too large (max ${maxBytes} bytes)`, 413)

/**
 * Streams the request body, aborting as soon as it exceeds `maxBytes`
 * (Content-Length can be absent or wrong, so it is not trusted on its own).
 */
async function readBodyText(request: NextRequest, maxBytes: number): Promise<string> {
  if (!request.body) return ''

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  let chunk = await reader.read()
  while (!chunk.done) {
    totalBytes += chunk.value.byteLength
    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw payloadTooLarge(maxBytes)
    }
    chunks.push(chunk.value)
    chunk = await reader.read()
  }

  return Buffer.concat(chunks).toString('utf8')
}

/**
 * Reads and parses a JSON body with a size cap.
 * Empty or malformed JSON → 400 INVALID_JSON; oversize → 413 PAYLOAD_TOO_LARGE.
 */
async function readJsonBody(request: NextRequest, maxBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw payloadTooLarge(maxBytes)
  }

  const text = await readBodyText(request, maxBytes)
  if (text.trim() === '') {
    throw new AppError('INVALID_JSON', 'Request body is empty; expected JSON', 400)
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    // Parser text is not echoed back to the client
    throw new AppError('INVALID_JSON', undefined, 400)
  }
}

/**
 * Creates a standardized API route handler with:
 * - Size-capped JSON body parsing (400 on malformed/empty JSON, 413 on oversize)
 * - Request body validation
 * - Error handling (non-AppError details stay in server logs, never in responses)
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
  const { name, schema, handler, method = 'POST', maxBodyBytes = DEFAULT_MAX_BODY_BYTES } = config

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
        body = await readJsonBody(request, maxBodyBytes)
      }

      // 2. Validate request body
      const validation = validateRequestBody(body || {}, schema)
      if (!validation.success) {
        return NextResponse.json(
          {
            status: 'error',
            status_code: 400,
            error_message: `Validation failed: ${validation.errors}`,
            error_code: 'INVALID_INPUT',
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
      // Expected/client-driven errors (validation, bad input, user rejection - status < 500)
      // and intentionally disabled tools are logged at warn so they don't crowd out real
      // failures in the error tracker.
      if (error instanceof AppError && (error.status < 500 || error.code === 'TOOL_DISABLED')) {
        logger.warn('API error', error, {
          route: `/api/${name}`,
        })
      } else {
        logger.error('API error', error, {
          route: `/api/${name}`,
        })
      }

      // Handle known AppError instances
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            status: 'error',
            status_code: error.status,
            error_message: error.message,
            error_code: error.code,
            data: null,
          },
          { status: error.status }
        )
      }

      // Handle unknown errors: details were logged above; respond with a safe, fixed message
      const userFriendlyMessage = handleServerError(error)
      const statusCode = 500

      return NextResponse.json(
        {
          status: 'error',
          status_code: statusCode,
          error_message: userFriendlyMessage,
          error_code: 'INTERNAL_ERROR',
          data: null,
        },
        { status: statusCode }
      )
    }
  }
}
