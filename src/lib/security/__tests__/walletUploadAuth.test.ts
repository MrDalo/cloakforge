// @vitest-environment jsdom
/**
 * Unit tests for src/lib/security/walletUploadAuth.ts
 */

import { describe, it, expect, vi } from 'vitest'
import { buildWalletUploadMessage, createWalletUploadAuthHeaders } from '../walletUploadAuth'

describe('buildWalletUploadMessage', () => {
  it('should embeds the wallet address and timestamp in a stable, prefixed format', () => {
    const message = buildWalletUploadMessage('WalletAddress123', 1700000000000)
    expect(message).toBe('cloakforge-ipfs-upload:WalletAddress123:1700000000000')
  })

  it('should produces different messages for different timestamps', () => {
    const a = buildWalletUploadMessage('Wallet', 1)
    const b = buildWalletUploadMessage('Wallet', 2)
    expect(a).not.toBe(b)
  })
})

describe('createWalletUploadAuthHeaders', () => {
  it('should signs the exact message built for the wallet and timestamp', async () => {
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    await createWalletUploadAuthHeaders('WalletAddress123', signMessage)

    expect(signMessage).toHaveBeenCalledOnce()
    const signedBytes = signMessage.mock.calls[0][0] as Uint8Array
    const signedMessage = new TextDecoder().decode(signedBytes)
    expect(signedMessage).toMatch(/^cloakforge-ipfs-upload:WalletAddress123:\d+$/)
  })

  it('should returns headers with a base64 signature, wallet address, and timestamp', async () => {
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    const headers = await createWalletUploadAuthHeaders('WalletAddress123', signMessage)

    expect(headers.Authorization).toBe(`Bearer ${Buffer.from([1, 2, 3, 4]).toString('base64')}`)
    expect(headers['x-wallet-address']).toBe('WalletAddress123')
    expect(Number(headers['x-timestamp'])).toBeGreaterThan(0)
  })

  it('should propagates errors from signMessage (e.g. user rejection)', async () => {
    const signMessage = vi.fn().mockRejectedValue(new Error('User rejected the request'))

    await expect(createWalletUploadAuthHeaders('WalletAddress123', signMessage)).rejects.toThrow('User rejected the request')
  })
})
