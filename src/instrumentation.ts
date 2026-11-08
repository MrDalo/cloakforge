import type { Instrumentation } from 'next'

/**
 * Next.js instrumentation hook.
 *
 * `register()` runs once per server instance at boot (dev server, `next start`, each Vercel function
 * cold start). Next.js skips it during `next build`, so builds without secrets keep working.
 */
export async function register(): Promise<void> {
  // Env validation reads server secrets — Node.js runtime only, never the Edge runtime.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { validateEnv } = await import('@/lib/config/env')
  // Throws in production when required variables are missing/invalid (names only, never values).
  validateEnv()
}

/** Error codes worth keeping (e.g. `INTERNAL_ERROR`, `ECONNRESET`); anything else is dropped. */
const ERROR_CODE_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/

/**
 * Reduces an unknown thrown value to static, PII-free identifiers. The message, stack and cause are
 * deliberately left out: they can carry wallet addresses, URLs or user input.
 *
 * @param error - Value thrown by the failing request.
 * @returns Error type name, optional code and the Next.js digest that links the log to the user-facing error.
 */
const describeRequestError = (error: unknown): { errorType: string; errorCode?: string; digest?: string } => {
  if (!(error instanceof Error)) return { errorType: typeof error }

  const { code, digest } = error as { code?: unknown; digest?: unknown }
  const errorCode = typeof code === 'string' || typeof code === 'number' ? String(code) : undefined
  return {
    errorType: error.constructor?.name || error.name || 'Error',
    errorCode: errorCode && ERROR_CODE_PATTERN.test(errorCode) ? errorCode : undefined,
    digest: typeof digest === 'string' ? digest : undefined,
  }
}

/**
 * Server error monitoring (M5): Next.js calls this for every uncaught error in a render, route
 * handler, server action or proxy. It logs one error-level event (shipped to Better Stack by the
 * logger) with the route PATTERN (e.g. `/blog/[slug]`), never the concrete path, query string,
 * headers or error message, so no PII leaves the server.
 *
 * Node.js runtime only: the pino logger cannot run on the Edge runtime (this app has no Edge routes).
 *
 * @param error - The thrown value (Next.js adds a `digest`).
 * @param request - Request info; only the HTTP method is read.
 * @param context - Router context; provides the route pattern and route type.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { getLogger } = await import('@/lib/logger/logger')
  getLogger({ context: 'instrumentation/onRequestError' }).error('Unhandled server request error', undefined, {
    ...describeRequestError(error),
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  })
}
