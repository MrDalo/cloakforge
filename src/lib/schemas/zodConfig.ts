import { z } from 'zod'

/**
 * Global Zod configuration, loaded by src/instrumentation-client.ts before any app code runs.
 *
 * Zod 4 probes `new Function('')` to decide whether it may JIT-compile schemas. Under our
 * Content-Security-Policy (no 'unsafe-eval') that probe is reported as a CSP violation on every
 * page view. `jitless` skips the probe and uses the regular (non-eval) parser, which is what
 * Zod falls back to under CSP anyway.
 */
z.config({ jitless: true })
