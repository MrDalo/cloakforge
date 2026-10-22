import { type NextRequest, type NextResponse } from 'next/server'
import getServerConfig from '@/lib/config/getServerConfig'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { assertNotSanctioned } from '@/lib/compliance/screenAddresses'
import { verifyWalletUploadAuth } from '@/lib/security/walletMessageAuth'
import { MAX_METADATA_JSON_BYTES, tokenMetadataUploadSchema } from '@/lib/schemas/ipfsSchemas'
import { buildGatewayUri, createPinataClient, ipfsErrorResponse, ipfsSuccessResponse, readRequestBodyWithLimit } from '@/lib/ipfs/server'

const logger = getLogger({
  context: 'api',
  route: '/api/ipfs/upload-json',
  method: 'POST',
})

const TOO_LARGE = {
  code: 'INVALID_METADATA_FORMAT',
  message: `Metadata too large. Maximum size is ${MAX_METADATA_JSON_BYTES / 1024}KB.`,
} as const

function parseJsonBody(body: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body))
  } catch {
    throw new AppError('INVALID_METADATA_FORMAT', 'Request body must be valid JSON.', 400)
  }
}

/**
 * POST /api/ipfs/upload-json
 *
 * Pins token metadata JSON to IPFS. Requires a fresh wallet signature authorizing the `json`
 * action. The body is capped at 16 KB and must match the strict token-metadata schema; only
 * the validated object (never the raw body) is uploaded.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertNotSanctioned(verifyWalletUploadAuth(request, 'json'))

    const body = await readRequestBodyWithLimit(request, MAX_METADATA_JSON_BYTES, TOO_LARGE)
    const parsed = tokenMetadataUploadSchema.safeParse(parseJsonBody(body))

    if (!parsed.success) {
      const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join('.') || 'body'))].slice(0, 5)
      throw new AppError('INVALID_METADATA_FORMAT', `Invalid metadata: ${fields.join(', ')}`, 400)
    }

    const { cid } = await createPinataClient().upload.public.json(parsed.data, {
      groupId: getServerConfig().ipfsJsonMetadataGroupId,
    })

    return ipfsSuccessResponse({ cid, uri: buildGatewayUri(cid) })
  } catch (error) {
    return ipfsErrorResponse(error, logger, {
      code: 'METADATA_UPLOAD_FAILED',
      message: 'Failed to upload metadata to IPFS. Please try again.',
    })
  }
}
