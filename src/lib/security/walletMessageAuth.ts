import 'server-only'
import { type NextRequest } from 'next/server'
import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import { AppError } from '@/lib/errors'
import { WALLET_UPLOAD_HEADERS, type WalletUploadAction, buildWalletUploadMessage, parseWalletUploadActions } from './walletUploadAuth'

/**
 * How long a signed upload authorization stays valid (either side of the server clock, to
 * tolerate client clock skew). The client signs right before uploading, so this only needs
 * to cover the logo + metadata upload round-trips.
 *
 * Signatures are NOT single-use: enforcing one-time nonces needs a shared store (Redis/KV),
 * which this deployment does not have. Replay within the window and throwaway keypairs are
 * instead bounded by Vercel WAF rate-limit rules on `/api/ipfs/*`, plus the strict file and
 * metadata validation in the upload routes.
 */
export const WALLET_UPLOAD_MAX_AGE_MS = 2 * 60 * 1000

const MAX_SIGNATURE_HEADER_LENGTH = 256

/** Verifies a nacl detached signature was produced by the given wallet's private key. */
export function verifyWalletMessageSignature(message: string, signature: string, publicKey: string): boolean {
  try {
    const signatureBytes = Buffer.from(signature, 'base64')
    const messageBytes = Buffer.from(message, 'utf8')
    const publicKeyBytes = new PublicKey(publicKey).toBytes()

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes)
  } catch {
    return false
  }
}

/** Rejects signed messages outside the freshness window to limit replay. */
const isMessageTimestampFresh = (timestamp: number): boolean => Math.abs(Date.now() - timestamp) <= WALLET_UPLOAD_MAX_AGE_MS

/** Hosts this request was addressed to (Host header and parsed request URL). */
function getRequestDomains(request: NextRequest): string[] {
  const domains = new Set<string>()
  const hostHeader = request.headers.get('host')?.trim().toLowerCase()
  if (hostHeader) domains.add(hostHeader)
  const urlHost = request.nextUrl.host.toLowerCase()
  if (urlHost) domains.add(urlHost)
  return [...domains]
}

/**
 * Verifies the wallet-signed authorization headers on an IPFS upload request for the given
 * action. The signed message must name this site's domain, include `action`, and be fresh.
 * Throws AppError (401/403) on any failure; returns the verified wallet address on success.
 */
export function verifyWalletUploadAuth(request: NextRequest, action: WalletUploadAction): string {
  const authHeader = request.headers.get(WALLET_UPLOAD_HEADERS.authorization)
  const walletAddress = request.headers.get(WALLET_UPLOAD_HEADERS.walletAddress)
  const timestampHeader = request.headers.get(WALLET_UPLOAD_HEADERS.timestamp)
  const actionsHeader = request.headers.get(WALLET_UPLOAD_HEADERS.actions)

  if (!authHeader?.startsWith('Bearer ') || !walletAddress || !timestampHeader || !actionsHeader) {
    throw new AppError('UNAUTHORIZED', 'Missing wallet authentication headers', 401)
  }

  const timestamp = Number(timestampHeader)
  if (!Number.isSafeInteger(timestamp) || !isMessageTimestampFresh(timestamp)) {
    throw new AppError('UNAUTHORIZED', 'Signature expired', 401)
  }

  const actions = parseWalletUploadActions(actionsHeader)
  if (!actions) {
    throw new AppError('UNAUTHORIZED', 'Invalid upload authorization', 401)
  }
  if (!actions.includes(action)) {
    throw new AppError('FORBIDDEN', 'Signature does not authorize this upload', 403)
  }

  const signature = authHeader.slice('Bearer '.length)
  if (signature.length > MAX_SIGNATURE_HEADER_LENGTH) {
    throw new AppError('UNAUTHORIZED', 'Invalid wallet signature', 401)
  }

  const isValid = getRequestDomains(request).some((domain) =>
    verifyWalletMessageSignature(
      buildWalletUploadMessage({ domain, walletAddress, actions: actionsHeader, timestamp }),
      signature,
      walletAddress
    )
  )

  if (!isValid) {
    throw new AppError('UNAUTHORIZED', 'Invalid wallet signature', 401)
  }

  return walletAddress
}
