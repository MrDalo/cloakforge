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
