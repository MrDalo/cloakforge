import 'server-only'
import { type NextRequest } from 'next/server'
import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import { AppError } from '@/lib/errors'
import { buildWalletUploadMessage } from './walletUploadAuth'

const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000

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

/** Rejects signed messages older than MAX_MESSAGE_AGE_MS to prevent replay. */
const isMessageTimestampFresh = (timestamp: number): boolean => Math.abs(Date.now() - timestamp) <= MAX_MESSAGE_AGE_MS

/**
 * Verifies the wallet-signed authorization headers on an IPFS upload request.
 * Throws AppError('UNAUTHORIZED', ..., 401) on any failure; returns the verified
 * wallet address on success.
 */
export function verifyWalletUploadAuth(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  const walletAddress = request.headers.get('x-wallet-address')
  const timestampHeader = request.headers.get('x-timestamp')

  if (!authHeader?.startsWith('Bearer ') || !walletAddress || !timestampHeader) {
    throw new AppError('UNAUTHORIZED', 'Missing wallet authentication headers', 401)
  }

  const timestamp = Number(timestampHeader)
  if (!Number.isFinite(timestamp) || !isMessageTimestampFresh(timestamp)) {
    throw new AppError('UNAUTHORIZED', 'Signature expired', 401)
  }

  const signature = authHeader.slice('Bearer '.length)
  const message = buildWalletUploadMessage(walletAddress, timestamp)

  if (!verifyWalletMessageSignature(message, signature, walletAddress)) {
    throw new AppError('UNAUTHORIZED', 'Invalid wallet signature', 401)
  }

  return walletAddress
}
