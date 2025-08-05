import { NextResponse } from 'next/server'
import { getLogger } from '@/lib/logger/logger'

export async function GET(): Promise<NextResponse> {
  const logger = getLogger({
    context: 'api',
    route: '/api/test-logger',
    method: 'GET',
  })

  // Test different log levels
  logger.info('This is an info message', {
    testData: 'sample info data',
    timestamp: new Date().toISOString(),
  })

  logger.warn('This is a warning message', {
    testData: 'sample warning data',
    warningType: 'performance',
  })

  logger.error('This is an error message', new Error('Sample test error'), {
    action: 'testLogger',
    severity: 'high',
  })

  logger.debug('This is a debug message', {
    testData: 'sample debug data',
    debugLevel: 'verbose',
  })

  return NextResponse.json({
    message: 'Logger test completed - check your server logs to see the new format!',
    logTypes: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
  })
}
