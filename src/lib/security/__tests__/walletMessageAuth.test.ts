/**
 * Unit tests for src/lib/security/walletMessageAuth.ts
 *
 * Uses real ed25519 keypairs (via tweetnacl) so the crypto verification path is
 * exercised for real, not mocked away.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import nacl from 'tweetnacl'
import { PublicKey } from '@solana/web3.js'

vi.mock('server-only', () => ({}))

import { WALLET_UPLOAD_MAX_AGE_MS, verifyWalletMessageSignature, verifyWalletUploadAuth } from '../walletMessageAuth'
import { buildWalletUploadMessage } from '../walletUploadAuth'
import { AppError } from '@/lib/errors'

const DOMAIN = 'localhost:3000'

function signMessage(message: string, secretKey: Uint8Array): string {
  const signatureBytes = nacl.sign.detached(new TextEncoder().encode(message), secretKey)
  return Buffer.from(signatureBytes).toString('base64')
}

function makeUploadRequest(headers: Record<string, string>, url = `http://${DOMAIN}/api/ipfs/upload-json`): NextRequest {
  return new NextRequest(url, { headers })
}

interface SignedHeadersOptions {
  actions?: string
  timestamp?: number
  domain?: string
  signer?: nacl.SignKeyPair
}

function signedHeaders(keypair: nacl.SignKeyPair, options: SignedHeadersOptions = {}): Record<string, string> {
  const walletAddress = new PublicKey(keypair.publicKey).toBase58()
  const { actions = 'file,json', timestamp = Date.now(), domain = DOMAIN, signer = keypair } = options
  const message = buildWalletUploadMessage({ domain, walletAddress, actions, timestamp })

  return {
    authorization: `Bearer ${signMessage(message, signer.secretKey)}`,
    'x-wallet-address': walletAddress,
    'x-timestamp': String(timestamp),
    'x-upload-actions': actions,
  }
}

function expectAuthError(fn: () => unknown, status: number): void {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).status).toBe(status)
    return
  }
  throw new Error('Expected verifyWalletUploadAuth to throw')
}

describe('verifyWalletMessageSignature', () => {
  it('should return true for a valid signature from the claimed wallet', () => {
    const keypair = nacl.sign.keyPair()
    const publicKey = new PublicKey(keypair.publicKey).toBase58()
    const signature = signMessage('hello world', keypair.secretKey)

    expect(verifyWalletMessageSignature('hello world', signature, publicKey)).toBe(true)
  })

  it('should return false when the signature was produced by a different keypair', () => {
    const signer = nacl.sign.keyPair()
    const publicKey = new PublicKey(nacl.sign.keyPair().publicKey).toBase58()
    const signature = signMessage('hello world', signer.secretKey)

    expect(verifyWalletMessageSignature('hello world', signature, publicKey)).toBe(false)
  })

  it('should return false when the message was tampered with', () => {
    const keypair = nacl.sign.keyPair()
    const publicKey = new PublicKey(keypair.publicKey).toBase58()
    const signature = signMessage('original message', keypair.secretKey)

    expect(verifyWalletMessageSignature('tampered message', signature, publicKey)).toBe(false)
  })

  it('should return false for a malformed public key or signature instead of throwing', () => {
    const keypair = nacl.sign.keyPair()
    const publicKey = new PublicKey(keypair.publicKey).toBase58()

    expect(verifyWalletMessageSignature('hello', signMessage('hello', keypair.secretKey), 'not-a-valid-pubkey')).toBe(false)
    expect(verifyWalletMessageSignature('hello', 'not-valid-base64!!', publicKey)).toBe(false)
  })
})

describe('verifyWalletUploadAuth', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the wallet address for a fresh signature covering the action', () => {
    const keypair = nacl.sign.keyPair()
    const request = makeUploadRequest(signedHeaders(keypair))

    expect(verifyWalletUploadAuth(request, 'json')).toBe(new PublicKey(keypair.publicKey).toBase58())
    expect(verifyWalletUploadAuth(request, 'file')).toBe(new PublicKey(keypair.publicKey).toBase58())
  })

  it('should accept the domain from the Host header', () => {
    const keypair = nacl.sign.keyPair()
    const headers = { ...signedHeaders(keypair, { domain: 'www.cloakforge.app' }), host: 'www.cloakforge.app' }

    expect(() => verifyWalletUploadAuth(makeUploadRequest(headers, 'http://internal:3000/api/ipfs/upload-json'), 'json')).not.toThrow()
  })

  it('should throw 401 when headers are missing (including the actions header)', () => {
    const keypair = nacl.sign.keyPair()
    const { 'x-upload-actions': _omitted, ...withoutActions } = signedHeaders(keypair)
    void _omitted

    expectAuthError(() => verifyWalletUploadAuth(makeUploadRequest({}), 'json'), 401)
    expectAuthError(() => verifyWalletUploadAuth(makeUploadRequest(withoutActions), 'json'), 401)
  })

  it('should throw 403 when the signature does not authorize the requested action', () => {
    const keypair = nacl.sign.keyPair()
    const request = makeUploadRequest(signedHeaders(keypair, { actions: 'json' }))

    expect(verifyWalletUploadAuth(request, 'json')).toBeTruthy()
    expectAuthError(() => verifyWalletUploadAuth(request, 'file'), 403)
  })

  it('should throw 401 when the actions header is changed after signing', () => {
    const keypair = nacl.sign.keyPair()
    const headers = { ...signedHeaders(keypair, { actions: 'json' }), 'x-upload-actions': 'file,json' }

    expectAuthError(() => verifyWalletUploadAuth(makeUploadRequest(headers), 'file'), 401)
  })

  it('should throw 401 for a non-canonical or unknown actions header', () => {
    const keypair = nacl.sign.keyPair()

    expectAuthError(() => verifyWalletUploadAuth(makeUploadRequest(signedHeaders(keypair, { actions: 'json,file' })), 'json'), 401)
    expectAuthError(() => verifyWalletUploadAuth(makeUploadRequest(signedHeaders(keypair, { actions: 'admin' })), 'json'), 401)
  })

  it('should throw 401 when the message was signed for another domain', () => {
    const keypair = nacl.sign.keyPair()
    const request = makeUploadRequest(signedHeaders(keypair, { domain: 'evil.example' }))

    expectAuthError(() => verifyWalletUploadAuth(request, 'json'), 401)
  })

  it('should accept a signature just inside the 2 minute window', () => {
    const keypair = nacl.sign.keyPair()
    const timestamp = Date.now() - WALLET_UPLOAD_MAX_AGE_MS + 5_000

    expect(() => verifyWalletUploadAuth(makeUploadRequest(signedHeaders(keypair, { timestamp })), 'json')).not.toThrow()
  })

  it('should throw 401 when the timestamp is older than 2 minutes (replay protection)', () => {
    expect(WALLET_UPLOAD_MAX_AGE_MS).toBe(2 * 60 * 1000)
    const keypair = nacl.sign.keyPair()
    const timestamp = Date.now() - WALLET_UPLOAD_MAX_AGE_MS - 1_000

    expectAuthError(() => verifyWalletUploadAuth(makeUploadRequest(signedHeaders(keypair, { timestamp })), 'json'), 401)
  })

  it('should throw 401 once a valid signature ages out of the window', () => {
    vi.useFakeTimers()
    const keypair = nacl.sign.keyPair()
    const request = makeUploadRequest(signedHeaders(keypair))

    expect(() => verifyWalletUploadAuth(request, 'json')).not.toThrow()
    vi.advanceTimersByTime(WALLET_UPLOAD_MAX_AGE_MS + 1)
    expectAuthError(() => verifyWalletUploadAuth(request, 'json'), 401)
  })

  it('should throw 401 when the timestamp is too far in the future or not an integer', () => {
    const keypair = nacl.sign.keyPair()

    expectAuthError(
      () =>
        verifyWalletUploadAuth(
          makeUploadRequest(signedHeaders(keypair, { timestamp: Date.now() + WALLET_UPLOAD_MAX_AGE_MS + 1_000 })),
          'json'
        ),
      401
    )
    expectAuthError(() => verifyWalletUploadAuth(makeUploadRequest(signedHeaders(keypair, { timestamp: Date.now() + 0.5 })), 'json'), 401)
  })

  it('should throw 401 when the signature does not match the claimed wallet', () => {
    const impersonated = nacl.sign.keyPair()
    const request = makeUploadRequest(signedHeaders(impersonated, { signer: nacl.sign.keyPair() }))

    expectAuthError(() => verifyWalletUploadAuth(request, 'json'), 401)
  })

  it('should throw 401 when the authorization header lacks the Bearer prefix', () => {
    const keypair = nacl.sign.keyPair()
    const headers = signedHeaders(keypair)
    headers.authorization = headers.authorization.slice('Bearer '.length)

    expectAuthError(() => verifyWalletUploadAuth(makeUploadRequest(headers), 'json'), 401)
  })
})
