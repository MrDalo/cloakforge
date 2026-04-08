import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Global test setup
vi.mock('server-only', () => ({}))

// Validate setup
export const validateTestSetup = () => {
  if (!vi) throw new Error('Vitest not available')
  return true
}
