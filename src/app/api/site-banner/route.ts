import { z } from 'zod'
import { createApiRoute } from '@/lib/api'
import { getCachedSiteBanner } from '@/lib/contentful/siteBannerCache'

/**
 * GET /api/site-banner
 *
 * Returns cached site banner configuration
 */
export const GET = createApiRoute({
  name: 'site-banner',
  schema: z.object({}), // No input for GET
  method: 'GET',
  handler: async () => {
    const banner = await getCachedSiteBanner()
    return { banner }
  },
})
