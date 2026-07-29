/**
 * Unit tests for src/lib/security/walletMessageAuth.ts
 *
 * Uses real ed25519 keypairs (via tweetnacl) so the crypto verification path is
 * exercised for real, not mocked away.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import nacl from 'tweetnacl'
import { PublicKey } from '@solana/web3.js'

vi.mock('server-only', () => ({}))

import { verifyWalletMessageSignature, verifyWalletUploadAuth } from '../walletMessageAuth'
import { buildWalletUploadMessage } from '../walletUploadAuth'
import { AppError } from '@/lib/errors'

function signMessage(message: string, secretKey: Uint8Array): string {
  const signatureBytes = nacl.sign.detached(new TextEncoder().encode(message), secretKey)
  return Buffer.from(signatureBytes).toString('base64')
}

function makeUploadRequest(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3000/api/ipfs/upload-json', { headers })
}

describe('verifyWalletMessageSignature', () => {
  it('should returns true for a valid signature from the claimed wallet', () => {
    const keypair = nacl.sign.keyPair()
    const publicKey = new PublicKey(keypair.publicKey).toBase58()
    const message = 'hello world'
    const signature = signMessage(message, keypair.secretKey)

    expect(verifyWalletMessageSignature(message, signature, publicKey)).toBe(true)
  })

  it('should returns false when the signature was produced by a different keypair', () => {
    const signer = nacl.sign.keyPair()
    const impersonated = nacl.sign.keyPair()
    const publicKey = new PublicKey(impersonated.publicKey).toBase58()
    const message = 'hello world'
    const signature = signMessage(message, signer.secretKey)

    expect(verifyWalletMessageSignature(message, signature, publicKey)).toBe(false)
  })

  it('should returns false when the message was tampered with', () => {
    const keypair = nacl.sign.keyPair()
    const publicKey = new PublicKey(keypair.publicKey).toBase58()
    const signature = signMessage('original message', keypair.secretKey)

    expect(verifyWalletMessageSignature('tampered message', signature, publicKey)).toBe(false)
  })

  it('should returns false for a malformed public key instead of throwing', () => {
    const keypair = nacl.sign.keyPair()
    const signature = signMessage('hello', keypair.secretKey)

    expect(verifyWalletMessageSignature('hello', signature, 'not-a-valid-pubkey')).toBe(false)
  })

  it('should returns false for a malformed signature instead of throwing', () => {
    const keypair = nacl.sign.keyPair()
    const publicKey = new PublicKey(keypair.publicKey).toBase58()

    expect(verifyWalletMessageSignature('hello', 'not-valid-base64!!', publicKey)).toBe(false)
  })
})

describe('verifyWalletUploadAuth', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('should returns the wallet address for a valid, fresh signature', () => {
    const keypair = nacl.sign.keyPair()
    const walletAddress = new PublicKey(keypair.publicKey).toBase58()
    const timestamp = Date.now()
    const message = buildWalletUploadMessage(walletAddress, timestamp)
    const signature = signMessage(message, keypair.secretKey)

    const request = makeUploadRequest({
      authorization: `Bearer ${signature}`,
      'x-wallet-address': walletAddress,
      'x-timestamp': String(timestamp),
    })

    expect(verifyWalletUploadAuth(request)).toBe(walletAddress)
  })

  it('should throws UNAUTHORIZED when headers are missing', () => {
    const request = makeUploadRequest({})

    expect(() => verifyWalletUploadAuth(request)).toThrow(AppError)
    try {
      verifyWalletUploadAuth(request)
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).status).toBe(401)
    }
  })

  it('should throws UNAUTHORIZED when the timestamp is too old (replay protection)', () => {
    const keypair = nacl.sign.keyPair()
    const walletAddress = new PublicKey(keypair.publicKey).toBase58()
    const staleTimestamp = Date.now() - 10 * 60 * 1000 // 10 minutes ago
    const message = buildWalletUploadMessage(walletAddress, staleTimestamp)
    const signature = signMessage(message, keypair.secretKey)

    const request = makeUploadRequest({
      authorization: `Bearer ${signature}`,
      'x-wallet-address': walletAddress,
      'x-timestamp': String(staleTimestamp),
    })

    expect(() => verifyWalletUploadAuth(request)).toThrow(AppError)
  })

  it('should throws UNAUTHORIZED when the signature does not match the claimed wallet', () => {
    const signer = nacl.sign.keyPair()
    const impersonated = nacl.sign.keyPair()
    const claimedWallet = new PublicKey(impersonated.publicKey).toBase58()
    const timestamp = Date.now()
    const message = buildWalletUploadMessage(claimedWallet, timestamp)
    const signature = signMessage(message, signer.secretKey)

    const request = makeUploadRequest({
      authorization: `Bearer ${signature}`,
      'x-wallet-address': claimedWallet,
      'x-timestamp': String(timestamp),
    })

    expect(() => verifyWalletUploadAuth(request)).toThrow(AppError)
  })

  it('should throws UNAUTHORIZED when the authorization header lacks the Bearer prefix', () => {
    const keypair = nacl.sign.keyPair()
    const walletAddress = new PublicKey(keypair.publicKey).toBase58()
    const timestamp = Date.now()
    const message = buildWalletUploadMessage(walletAddress, timestamp)
    const signature = signMessage(message, keypair.secretKey)

    const request = makeUploadRequest({
      authorization: signature,
      'x-wallet-address': walletAddress,
      'x-timestamp': String(timestamp),
    })

    expect(() => verifyWalletUploadAuth(request)).toThrow(AppError)
  })
})
