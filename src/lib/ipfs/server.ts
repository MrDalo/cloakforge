import 'server-only'
import { NextResponse } from 'next/server'
import { PinataSDK } from 'pinata'
import getServerConfig from '@/lib/config/getServerConfig'
import { AppError, type ErrorCode } from '@/lib/errors'
import { type getLogger } from '@/lib/logger/logger'

type Logger = ReturnType<typeof getLogger>

export interface IpfsUploadResult {
  cid: string
  uri: string
}

/** Pinata client for the project account (JWT and gateway from server config). */
export function createPinataClient(): PinataSDK {
  const config = getServerConfig()
  return new PinataSDK({
    pinataJwt: config.ipfsJWT,
    pinataGateway: config.ipfsGateway,
  })
}

/** Public gateway URI for an uploaded CID. */
export const buildGatewayUri = (cid: string): string => `https://${getServerConfig().ipfsGateway}/ipfs/${cid}`

/**
 * Reads the raw request body, refusing anything over `maxBytes`.
 * Checks the declared `content-length` first so oversized requests are rejected before any
 * buffering, then enforces the same cap while streaming (covers missing or lying headers).
 */
export async function readRequestBodyWithLimit(
  request: Request,
  maxBytes: number,
  tooLarge: { code: ErrorCode; message: string }
): Promise<Uint8Array<ArrayBuffer>> {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null) {
    const length = Number(declaredLength)
    if (!Number.isFinite(length) || length < 0) {
      throw new AppError('INVALID_INPUT', 'Invalid Content-Length header', 400)
    }
    if (length > maxBytes) {
      throw new AppError(tooLarge.code, tooLarge.message, 413)
    }
  }

  if (!request.body) return new Uint8Array(0)

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw new AppError(tooLarge.code, tooLarge.message, 413)
    }
    chunks.push(value)
  }

  const body = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

/** Standard success envelope for the IPFS upload routes. */
export const ipfsSuccessResponse = (data: IpfsUploadResult): NextResponse =>
  NextResponse.json({ status: 'success', status_code: 200, error_message: '', data })

const errorResponse = (status: number, code: string, message: string): NextResponse =>
  NextResponse.json({ status: 'error', status_code: status, error_message: message, error_code: code, data: null }, { status })

/**
 * Maps any error to a client response without leaking internals: our own client-facing
 * AppErrors (status < 500) keep their message; everything else (Pinata SDK, network, parser
 * errors) is logged and replaced with a generic message.
 */
export function ipfsErrorResponse(error: unknown, logger: Logger, fallback: { code: ErrorCode; message: string }): NextResponse {
  if (error instanceof AppError && error.status < 500) {
    logger.warn('IPFS upload rejected', undefined, { code: error.code, status: error.status })
    return errorResponse(error.status, error.code, error.message)
  }

  logger.error('IPFS upload failed', error)
  return errorResponse(500, fallback.code, fallback.message)
}
