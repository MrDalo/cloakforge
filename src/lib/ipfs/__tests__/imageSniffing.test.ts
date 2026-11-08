/**
 * Unit tests for src/lib/ipfs/imageSniffing.ts
 */

import { describe, it, expect } from 'vitest'
import { buildSafeImageFileName, sniffImageType } from '../imageSniffing'

const bytes = (...values: number[]): Uint8Array => new Uint8Array(values)
const ascii = (text: string): Uint8Array => new TextEncoder().encode(text)
const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

const IMAGE_SAMPLES = {
  png: concat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), new Uint8Array(32)),
  jpeg: concat(bytes(0xff, 0xd8, 0xff, 0xe0), new Uint8Array(32)),
  gif87: concat(ascii('GIF87a'), new Uint8Array(32)),
  gif89: concat(ascii('GIF89a'), new Uint8Array(32)),
  webp: concat(ascii('RIFF'), bytes(0x24, 0, 0, 0), ascii('WEBPVP8 '), new Uint8Array(32)),
}

describe('sniffImageType', () => {
  it('should detect PNG, JPEG, GIF and WEBP from magic bytes', () => {
    expect(sniffImageType(IMAGE_SAMPLES.png)).toEqual({ mimeType: 'image/png', extension: 'png' })
    expect(sniffImageType(IMAGE_SAMPLES.jpeg)).toEqual({ mimeType: 'image/jpeg', extension: 'jpg' })
    expect(sniffImageType(IMAGE_SAMPLES.gif87)).toEqual({ mimeType: 'image/gif', extension: 'gif' })
    expect(sniffImageType(IMAGE_SAMPLES.gif89)).toEqual({ mimeType: 'image/gif', extension: 'gif' })
    expect(sniffImageType(IMAGE_SAMPLES.webp)).toEqual({ mimeType: 'image/webp', extension: 'webp' })
  })

  it('should reject SVG documents, including ones with a script', () => {
    expect(sniffImageType(ascii('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull()
    expect(sniffImageType(ascii('<?xml version="1.0"?><svg></svg>'))).toBeNull()
    expect(sniffImageType(concat(bytes(0xef, 0xbb, 0xbf), ascii('<svg></svg>')))).toBeNull()
  })

  it('should reject HTML and other non-image content', () => {
    expect(sniffImageType(ascii('<!DOCTYPE html><html><body>hi</body></html>'))).toBeNull()
    expect(sniffImageType(ascii('%PDF-1.7'))).toBeNull()
    expect(sniffImageType(ascii('{"name":"token"}'))).toBeNull()
    expect(sniffImageType(new Uint8Array(64))).toBeNull()
  })

  it('should reject a RIFF container that is not WEBP (e.g. WAV/AVI)', () => {
    expect(sniffImageType(concat(ascii('RIFF'), bytes(0x24, 0, 0, 0), ascii('WAVEfmt ')))).toBeNull()
  })

  it('should reject truncated signatures and empty input', () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47))).toBeNull()
    expect(sniffImageType(bytes(0xff, 0xd8))).toBeNull()
    expect(sniffImageType(ascii('RIFF1234WEB'))).toBeNull()
    expect(sniffImageType(new Uint8Array(0))).toBeNull()
  })
})

describe('buildSafeImageFileName', () => {
  it('should replace the extension with the sniffed one', () => {
    expect(buildSafeImageFileName('logo.svg', 'png')).toBe('logo.png')
    expect(buildSafeImageFileName('photo.final.jpeg', 'jpg')).toBe('photo-final.jpg')
  })

  it('should strip paths and unusual characters', () => {
    expect(buildSafeImageFileName('C:\\Users\\me\\my logo<script>.png', 'png')).toBe('my-logo-script.png')
    expect(buildSafeImageFileName('/tmp/../a b.gif', 'gif')).toBe('a-b.gif')
  })

  it('should fall back to a default name and cap the length', () => {
    expect(buildSafeImageFileName('', 'webp')).toBe('token-logo.webp')
    expect(buildSafeImageFileName('.png', 'png')).toBe('token-logo.png')
    expect(buildSafeImageFileName(`${'a'.repeat(200)}.png`, 'png')).toBe(`${'a'.repeat(64)}.png`)
  })
})
