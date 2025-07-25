import { NextResponse } from 'next/server'
import { getSiteBanner } from '@/lib/contentful/client'
import { getLogger } from '@/lib/logger/logger'

export async function GET(): Promise<NextResponse> {
  const logger = getLogger({ context: 'api', route: '/api/site-banner' })

  try {
    logger.info('Fetching site banner from Contentful')

    const banner = await getSiteBanner()
    return NextResponse.json({ banner })
  } catch (error) {
    logger.error('Error fetching site banner:', error, {
      action: 'getSiteBanner',
    })
    return NextResponse.json({ banner: null, error: 'Failed to fetch banner' }, { status: 500 })
  }
}
