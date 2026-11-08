import { describe, it, expect, vi, afterEach } from 'vitest'
import PreviewLayout, { metadata } from '../layout'

const NOT_FOUND = new Error('NEXT_NOT_FOUND')

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw NOT_FOUND
  }),
}))

describe('PreviewLayout (/preview debug segment)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each(['production', 'test'])('should render 404 when NODE_ENV is %s', (nodeEnv) => {
    vi.stubEnv('NODE_ENV', nodeEnv)

    expect(() => PreviewLayout({ children: 'preview page' })).toThrow(NOT_FOUND)
  })

  it('should render the page in development', () => {
    vi.stubEnv('NODE_ENV', 'development')

    expect(() => PreviewLayout({ children: 'preview page' })).not.toThrow()
  })

  it('should be marked noindex', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
