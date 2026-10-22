// @vitest-environment jsdom
/**
 * Unit tests for src/lib/security/walletUploadAuth.ts
 */

import { describe, it, expect, vi } from 'vitest'
import {
  buildWalletUploadMessage,
  createWalletUploadAuthHeaders,
  formatWalletUploadActions,
  parseWalletUploadActions,
} from '../walletUploadAuth'

describe('buildWalletUploadMessage', () => {
  it('should embed domain, wallet, actions and timestamp in a stable format', () => {
    const message = buildWalletUploadMessage({
      domain: 'www.cloakforge.app',
      walletAddress: 'WalletAddress123',
      actions: 'file,json',
      timestamp: 1700000000000,
    })

    expect(message).toBe(
      [
        'CloakForge IPFS upload authorization',
        'Signing this message does not send a transaction or cost any fees.',
        '',
        'Domain: www.cloakforge.app',
        'Wallet: WalletAddress123',
        'Actions: file,json',
        'Issued At: 2023-11-14T22:13:20.000Z',
        'Timestamp: 1700000000000',
      ].join('\n')
    )
  })

  it('should produce different messages for different domains, actions or timestamps', () => {
    const base = { domain: 'a.example', walletAddress: 'Wallet', actions: 'json', timestamp: 1 }
    const message = buildWalletUploadMessage(base)

    expect(buildWalletUploadMessage({ ...base, domain: 'b.example' })).not.toBe(message)
    expect(buildWalletUploadMessage({ ...base, actions: 'file' })).not.toBe(message)
    expect(buildWalletUploadMessage({ ...base, timestamp: 2 })).not.toBe(message)
  })
})

describe('formatWalletUploadActions / parseWalletUploadActions', () => {
  it('should canonicalise order and remove duplicates', () => {
    expect(formatWalletUploadActions(['json', 'file', 'json'])).toBe('file,json')
    expect(formatWalletUploadActions(['json'])).toBe('json')
  })

  it('should parse only canonical action lists', () => {
    expect(parseWalletUploadActions('file,json')).toEqual(['file', 'json'])
    expect(parseWalletUploadActions('json')).toEqual(['json'])
    expect(parseWalletUploadActions('json,file')).toBeNull()
    expect(parseWalletUploadActions('file,file')).toBeNull()
    expect(parseWalletUploadActions('file,admin')).toBeNull()
    expect(parseWalletUploadActions('')).toBeNull()
    expect(parseWalletUploadActions(null)).toBeNull()
  })
})

describe('createWalletUploadAuthHeaders', () => {
  it('should sign the message bound to the current host and requested actions', async () => {
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    const headers = await createWalletUploadAuthHeaders('WalletAddress123', signMessage, ['json', 'file'])

    expect(signMessage).toHaveBeenCalledOnce()
    const signedMessage = new TextDecoder().decode(signMessage.mock.calls[0][0] as Uint8Array)
    expect(signedMessage).toBe(
      buildWalletUploadMessage({
        domain: window.location.host,
        walletAddress: 'WalletAddress123',
        actions: 'file,json',
        timestamp: Number(headers['x-timestamp']),
      })
    )
  })

  it('should return headers with a base64 signature, wallet address, timestamp and actions', async () => {
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    const headers = await createWalletUploadAuthHeaders('WalletAddress123', signMessage, ['json'], 'www.cloakforge.app')

    expect(headers.Authorization).toBe(`Bearer ${Buffer.from([1, 2, 3, 4]).toString('base64')}`)
    expect(headers['x-wallet-address']).toBe('WalletAddress123')
    expect(Number(headers['x-timestamp'])).toBeGreaterThan(0)
    expect(headers['x-upload-actions']).toBe('json')
    expect(new TextDecoder().decode(signMessage.mock.calls[0][0] as Uint8Array)).toContain('Domain: www.cloakforge.app')
  })

  it('should reject an empty action list without prompting the wallet', async () => {
    const signMessage = vi.fn()
    await expect(createWalletUploadAuthHeaders('WalletAddress123', signMessage, [])).rejects.toThrow('At least one upload action')
    expect(signMessage).not.toHaveBeenCalled()
  })

  it('should propagate errors from signMessage (e.g. user rejection)', async () => {
    const signMessage = vi.fn().mockRejectedValue(new Error('User rejected the request'))

    await expect(createWalletUploadAuthHeaders('WalletAddress123', signMessage, ['json'])).rejects.toThrow('User rejected the request')
  })
})
