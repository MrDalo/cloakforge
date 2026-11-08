import { type NextRequest, type NextResponse } from 'next/server'
import getServerConfig from '@/lib/config/getServerConfig'
import { getLogger } from '@/lib/logger/logger'
import { verifyWalletUploadAuth } from '@/lib/security/walletMessageAuth'
import { AppError } from '@/lib/errors'
import { assertNotSanctioned } from '@/lib/compliance/screenAddresses'
import { MAX_IMAGE_UPLOAD_BYTES, buildSafeImageFileName, sniffImageType } from '@/lib/ipfs/imageSniffing'
import { buildGatewayUri, createPinataClient, ipfsErrorResponse, ipfsSuccessResponse, readRequestBodyWithLimit } from '@/lib/ipfs/server'

const logger = getLogger({
  context: 'api',
  route: '/api/ipfs/upload-file',
  method: 'POST',
})

/** Multipart framing (boundaries, part headers, file name) allowed on top of the file bytes. */
const MULTIPART_OVERHEAD_BYTES = 16 * 1024
const TOO_LARGE = {
  code: 'IMAGE_TOO_LARGE',
  message: `File too large. Maximum size is ${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)}MB.`,
} as const

async function parseMultipartBody(body: Uint8Array<ArrayBuffer>, contentType: string): Promise<FormData> {
  try {
    return await new Response(body, { headers: { 'content-type': contentType } }).formData()
  } catch {
    throw new AppError('INVALID_INPUT', 'Malformed upload body.', 400)
  }
}

/**
 * POST /api/ipfs/upload-file
 *
 * Pins a token logo to IPFS. Requires a fresh wallet signature authorizing the `file` action.
 * Only PNG/JPEG/GIF/WEBP are accepted, detected from magic bytes (the client MIME type and
 * extension are ignored); the file is re-wrapped with the sniffed content type before upload.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertNotSanctioned(verifyWalletUploadAuth(request, 'file'))

    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      throw new AppError('INVALID_INPUT', 'Expected a multipart/form-data upload.', 415)
    }

    const body = await readRequestBodyWithLimit(request, MAX_IMAGE_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES, TOO_LARGE)
    const formData = await parseMultipartBody(body, contentType)
    const file = formData.get('file')

    if (!(file instanceof File)) {
      throw new AppError('MISSING_REQUIRED_FIELD', 'No file provided. Please select a file to upload.', 400)
    }

    if (file.name.includes('../') || file.name.includes('..\\')) {
      throw new AppError('INVALID_INPUT', 'Invalid file name.', 400)
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (bytes.byteLength > MAX_IMAGE_UPLOAD_BYTES) {
      throw new AppError(TOO_LARGE.code, TOO_LARGE.message, 413)
    }

    const imageType = sniffImageType(bytes)
    if (!imageType) {
      throw new AppError('UNSUPPORTED_IMAGE_FORMAT', 'Invalid file type. Allowed types: PNG, JPEG, GIF, WEBP.', 415)
    }

    const safeFile = new File([bytes], buildSafeImageFileName(file.name, imageType.extension), { type: imageType.mimeType })
    const { cid } = await createPinataClient().upload.public.file(safeFile, {
      groupId: getServerConfig().ipfsTokenImagesGroupId,
    })

    return ipfsSuccessResponse({ cid, uri: buildGatewayUri(cid) })
  } catch (error) {
    return ipfsErrorResponse(error, logger, {
      code: 'IMAGE_UPLOAD_FAILED',
      message: 'Failed to upload file to IPFS. Please try again.',
    })
  }
}
