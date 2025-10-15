import { NextRequest, NextResponse } from 'next/server'
import { PinataSDK } from 'pinata'
import getServerConfig from '@/lib/config/getServerConfig'
import { getLogger } from '@/lib/logger/logger'
import { validateSecurity } from '@/lib/security/originValidator'
import { AppError } from '@/lib/errors'

const config = getServerConfig()
const logger = getLogger({
  context: 'api',
  route: '/api/ipfs/upload-json',
  method: 'POST',
})

const pinata = new PinataSDK({
  pinataJwt: config.ipfsJWT,
  pinataGateway: config.ipfsGateway,
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Privacy-first: Only origin validation, no rate limiting or data collection
    await validateSecurity(request, {
      skipForLocalhost: true,
    })

    const json = await request.json()

    if (!json || typeof json !== 'object') {
      logger.warn('Invalid JSON data provided')
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Invalid JSON data provided. Please provide a valid JSON object.',
          error_code: 'INVALID_INPUT',
          data: null,
        },
        { status: 400 }
      )
    }

    // Validate JSON size (1MB limit for metadata)
    const jsonString = JSON.stringify(json)
    if (jsonString.length > 1024 * 1024) {
      logger.warn('JSON data too large', { size: jsonString.length, maxSize: 1024 * 1024 })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'JSON data too large. Maximum size is 1MB.',
          error_code: 'FILE_TOO_LARGE',
          data: null,
        },
        { status: 400 }
      )
    }

    const response = await pinata.upload.public.json(json, {
      groupId: config.ipfsJsonMetadataGroupId,
    })

    const uri = `https://${config.ipfsGateway}/ipfs/${response.cid}`

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: {
        cid: response.cid,
        uri,
      },
    })
  } catch (error) {
    // Handle origin validation errors
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

    logger.error('IPFS JSON upload error', error, {
      requestHeaders: Object.fromEntries(request.headers.entries()),
    })

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: 'Failed to upload JSON to IPFS. Please try again.',
        error_code: 'SERVICE_UNAVAILABLE',
        data: null,
      },
      { status: 500 }
    )
  }
}
