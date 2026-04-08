import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Global test setup: stub out the server-only package so server utilities
// can be imported in the node test environment without throwing.
vi.mock('server-only', () => ({}))
