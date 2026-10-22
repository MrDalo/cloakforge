import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import nacl from 'tweetnacl'
import { PublicKey } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import {
  ADMIN_ACCESS_MESSAGE_TTL_MS,
  buildAdminAccessMessage,
  encodeAdminAccessMessageHeader,
  isAdminAccessMessageFresh,
  parseAdminAccessMessage,
} from '../adminAuthMessage'
import { getAdminWalletAllowlist, verifyAdminRequest } from '../adminAuth'

const mockServerConfig = { feeWalletAddress: '' }
vi.mock('@/lib/config/getServerConfig', () => ({
  default: () => mockServerConfig,
}))

const HOST = 'cloakforge.app'
const NOW = new Date('2026-10-16T12:00:00.000Z')

const adminKeypair = nacl.sign.keyPair()
const ADMIN_WALLET = new PublicKey(adminKeypair.publicKey).toBase58()
const otherKeypair = nacl.sign.keyPair()
const OTHER_WALLET = new PublicKey(otherKeypair.publicKey).toBase58()

interface SignedRequestOptions {
  keypair?: nacl.SignKeyPair
  wallet?: string
  headerWallet?: string
  domain?: string
  host?: string
  issuedAt?: Date
  message?: string
}

function makeSignedRequest(options: SignedRequestOptions = {}): NextRequest {
  const keypair = options.keypair ?? adminKeypair
  const wallet = options.wallet ?? new PublicKey(keypair.publicKey).toBase58()
  const message = options.message ?? buildAdminAccessMessage({ domain: options.domain ?? HOST, wallet, issuedAt: options.issuedAt ?? NOW })
  const signature = Buffer.from(nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey)).toString('base64')

  return new NextRequest(`https://${options.host ?? HOST}/api/admin/transactions`, {
    headers: {
      host: options.host ?? HOST,
      authorization: `Bearer ${signature}`,
      'x-wallet-address': options.headerWallet ?? wallet,
      'x-message': encodeAdminAccessMessageHeader(message),
    },
  })
}

const expectAuthError = (request: NextRequest, status: number): void => {
  try {
    verifyAdminRequest(request)
  } catch (error) {
    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).status).toBe(status)
    return
  }
  throw new Error('Expected verifyAdminRequest to throw')
}

describe('adminAuthMessage', () => {
  it('should round-trip a built message through the parser', () => {
    const message = buildAdminAccessMessage({ domain: 'Localhost:3001', wallet: ADMIN_WALLET, issuedAt: NOW })

    expect(message).toBe(`CloakForge Admin Access\nDomain: localhost:3001\nWallet: ${ADMIN_WALLET}\nIssued At: ${NOW.toISOString()}`)
    expect(parseAdminAccessMessage(message)).toEqual({ domain: 'localhost:3001', wallet: ADMIN_WALLET, issuedAt: NOW })
  })

  it.each([
    ['legacy session message', 'CloakForge Admin Session: 1700000000000'],
    ['IPFS upload message', `cloakforge-ipfs-upload:${ADMIN_WALLET}:1700000000000`],
    ['wrong title', `CloakForge Admin\nDomain: ${HOST}\nWallet: ${ADMIN_WALLET}\nIssued At: ${NOW.toISOString()}`],
    ['extra line', `${buildAdminAccessMessage({ domain: HOST, wallet: ADMIN_WALLET, issuedAt: NOW })}\nNonce: 1`],
    ['non-canonical timestamp', `CloakForge Admin Access\nDomain: ${HOST}\nWallet: ${ADMIN_WALLET}\nIssued At: 2026-10-16T12:00:00Z`],
    ['invalid wallet', `CloakForge Admin Access\nDomain: ${HOST}\nWallet: not-a-wallet\nIssued At: ${NOW.toISOString()}`],
    ['invalid domain', `CloakForge Admin Access\nDomain: evil.com/path\nWallet: ${ADMIN_WALLET}\nIssued At: ${NOW.toISOString()}`],
  ])('should reject a malformed message (%s)', (_label, message) => {
    expect(parseAdminAccessMessage(message)).toBeNull()
  })

  it('should treat messages older than the TTL or too far in the future as stale', () => {
    const now = NOW.getTime()

    expect(isAdminAccessMessageFresh(now - ADMIN_ACCESS_MESSAGE_TTL_MS, now)).toBe(true)
    expect(isAdminAccessMessageFresh(now - ADMIN_ACCESS_MESSAGE_TTL_MS - 1, now)).toBe(false)
    expect(isAdminAccessMessageFresh(now + 60_000, now)).toBe(true)
    expect(isAdminAccessMessageFresh(now + 60_001, now)).toBe(false)
  })
})

describe('getAdminWalletAllowlist', () => {
  beforeEach(() => {
    mockServerConfig.feeWalletAddress = ADMIN_WALLET
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should read ADMIN_WALLET_ADDRESSES and drop invalid entries', () => {
    vi.stubEnv('ADMIN_WALLET_ADDRESSES', ` ${OTHER_WALLET} , not-a-wallet,,`)

    expect(getAdminWalletAllowlist()).toEqual([OTHER_WALLET])
  })

  it('should fall back to the fee wallet when ADMIN_WALLET_ADDRESSES is unset', () => {
    vi.stubEnv('ADMIN_WALLET_ADDRESSES', '')

    expect(getAdminWalletAllowlist()).toEqual([ADMIN_WALLET])
  })

  it('should return an empty allowlist when nothing is configured', () => {
    vi.stubEnv('ADMIN_WALLET_ADDRESSES', '')
    mockServerConfig.feeWalletAddress = ''

    expect(getAdminWalletAllowlist()).toEqual([])
  })
})

describe('verifyAdminRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    mockServerConfig.feeWalletAddress = ADMIN_WALLET
    vi.stubEnv('ADMIN_WALLET_ADDRESSES', '')
    vi.stubEnv('ADMIN_ALLOWED_DOMAINS', '')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('should accept a fresh, correctly signed message from the admin wallet', () => {
    expect(verifyAdminRequest(makeSignedRequest())).toBe(ADMIN_WALLET)
  })

  it('should accept wallets from ADMIN_WALLET_ADDRESSES', () => {
    vi.stubEnv('ADMIN_WALLET_ADDRESSES', OTHER_WALLET)

    expect(verifyAdminRequest(makeSignedRequest({ keypair: otherKeypair }))).toBe(OTHER_WALLET)
  })

  it('should reject a correctly signed message from a non-admin wallet with 403', () => {
    expectAuthError(makeSignedRequest({ keypair: otherKeypair }), 403)
  })

  it('should reject the fee wallet once ADMIN_WALLET_ADDRESSES names other wallets', () => {
    vi.stubEnv('ADMIN_WALLET_ADDRESSES', OTHER_WALLET)

    expectAuthError(makeSignedRequest(), 403)
  })

  it('should reject missing headers with 401', () => {
    expectAuthError(new NextRequest(`https://${HOST}/api/admin/transactions`, { headers: { host: HOST } }), 401)
  })

  it('should reject a replayed legacy or foreign message even when validly signed', () => {
    expectAuthError(makeSignedRequest({ message: 'CloakForge Admin Session: 1700000000000' }), 401)
    expectAuthError(makeSignedRequest({ message: `cloakforge-ipfs-upload:${ADMIN_WALLET}:1700000000000` }), 401)
  })

  it('should reject an expired message', () => {
    expectAuthError(makeSignedRequest({ issuedAt: new Date(NOW.getTime() - ADMIN_ACCESS_MESSAGE_TTL_MS - 1000) }), 401)
  })

  it('should reject a message issued too far in the future', () => {
    expectAuthError(makeSignedRequest({ issuedAt: new Date(NOW.getTime() + 2 * 60 * 1000) }), 401)
  })

  it('should accept a message issued slightly in the future (clock skew)', () => {
    expect(verifyAdminRequest(makeSignedRequest({ issuedAt: new Date(NOW.getTime() + 30 * 1000) }))).toBe(ADMIN_WALLET)
  })

  it('should reject a message signed for another domain', () => {
    expectAuthError(makeSignedRequest({ domain: 'evil.example' }), 401)
  })

  it('should use ADMIN_ALLOWED_DOMAINS instead of the request host when set', () => {
    vi.stubEnv('ADMIN_ALLOWED_DOMAINS', 'admin.cloakforge.app, www.cloakforge.app')

    expect(verifyAdminRequest(makeSignedRequest({ domain: 'www.cloakforge.app' }))).toBe(ADMIN_WALLET)
    expectAuthError(makeSignedRequest({ domain: HOST }), 401)
  })

  it('should reject a message whose wallet differs from the x-wallet-address header', () => {
    expectAuthError(makeSignedRequest({ headerWallet: OTHER_WALLET }), 401)
  })

  it('should reject a signature made by another key', () => {
    // Message claims the admin wallet but is signed by another keypair
    expectAuthError(makeSignedRequest({ keypair: otherKeypair, wallet: ADMIN_WALLET }), 401)
  })

  it('should reject a non-base64 x-message header', () => {
    const request = makeSignedRequest()
    const tampered = new NextRequest(request.url, {
      headers: { ...Object.fromEntries(request.headers), 'x-message': 'not base64!' },
    })

    expectAuthError(tampered, 401)
  })
})
