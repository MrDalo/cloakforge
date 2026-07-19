import { type NextRequest, NextResponse } from 'next/server'
import { PinataSDK } from 'pinata'
import getServerConfig from '@/lib/config/getServerConfig'
import { getLogger } from '@/lib/logger/logger'
import { verifyWalletUploadAuth } from '@/lib/security/walletMessageAuth'
import { AppError } from '@/lib/errors'

const config = getServerConfig()
const logger = getLogger({
  context: 'api',
  route: '/api/ipfs/upload-file',
  method: 'POST',
})

const pinata = new PinataSDK({
  pinataJwt: config.ipfsJWT,
  pinataGateway: config.ipfsGateway,
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Requires a fresh wallet-signed message proving the caller holds the claimed wallet's key
    verifyWalletUploadAuth(request)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'No file provided. Please select a file to upload.',
          error_code: 'MISSING_REQUIRED_FIELD',
          data: null,
        },
        { status: 400 }
      )
    }

    // Enhanced file validation
    const maxSize = 3 * 1024 * 1024 // 3MB
    if (file.size > maxSize) {
      logger.warn('File too large', undefined, { fileName: file.name, fileSize: file.size, maxSize })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
          error_code: 'FILE_TOO_LARGE',
          data: null,
        },
        { status: 400 }
      )
    }

    // Validate file type with better error messaging
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      logger.warn('Invalid file type attempted', undefined, { fileName: file.name, fileType: file.type, allowedTypes })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}.`,
          error_code: 'FILE_TYPE_NOT_SUPPORTED',
          data: null,
        },
        { status: 400 }
      )
    }

    // Additional security: Check file name for suspicious patterns
    if (file.name.includes('../') || file.name.includes('..\\')) {
      logger.error('Suspicious file name detected', { fileName: file.name })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Invalid file name.',
          error_code: 'INVALID_INPUT',
          data: null,
        },
        { status: 400 }
      )
    }

    const response = await pinata.upload.public.file(file, {
      groupId: config.ipfsTokenImagesGroupId,
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
    // Handle wallet-auth validation errors
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

    logger.error('IPFS file upload error', error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: 'Failed to upload file to IPFS. Please try again.',
        error_code: 'SERVICE_UNAVAILABLE',
        data: null,
      },
      { status: 500 }
    )
  }
}
