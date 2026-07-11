import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Global test setup: stub out the server-only package so server utilities
// can be imported in the node test environment without throwing.
vi.mock('server-only', () => ({}))

// Suppress logger output during tests
vi.mock('@/lib/logger/logger', () => {
  const noop = () => {}
  const mockLogger = { info: noop, warn: noop, error: noop, debug: noop }
  return {
    getLogger: () => mockLogger,
    logToServer: noop,
  }
})
