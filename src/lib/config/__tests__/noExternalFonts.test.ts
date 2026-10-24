import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const SRC_ROOT = resolve(__dirname, '../../..')
const SCANNED_EXTENSIONS = /\.(css|scss|ts|tsx)$/
// Built from parts so this file does not match itself.
const FORBIDDEN_HOSTS = ['fonts.google' + 'apis.com', 'fonts.g' + 'static.com']

const collectFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) return collectFiles(fullPath)
    return SCANNED_EXTENSIONS.test(entry.name) ? [fullPath] : []
  })

describe('external font hosts (GDPR)', () => {
  it('should not reference Google Fonts hosts in any CSS or TypeScript source', () => {
    const offenders = collectFiles(SRC_ROOT)
      .filter((file) => {
        const content = readFileSync(file, 'utf8')
        return FORBIDDEN_HOSTS.some((host) => content.includes(host))
      })
      .map((file) => relative(SRC_ROOT, file))

    expect(offenders).toEqual([])
  })

  it('should self-host the wallet adapter stylesheet instead of importing the package CSS', () => {
    const layout = readFileSync(join(SRC_ROOT, 'app/layout.tsx'), 'utf8')
    expect(layout).not.toContain('@solana/wallet-adapter-react-ui/styles.css')
    expect(layout).toContain('@/styles/wallet-adapter.css')
  })
})
