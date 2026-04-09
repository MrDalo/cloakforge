// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'

// Mock ReactQueryDevtools to avoid rendering issues in tests
vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}))

import QueryProvider from '../QueryProvider'

// ---------------------------------------------------------------------------
// A consumer that reads the query client and exposes its stale-time setting
// ---------------------------------------------------------------------------
const QueryClientInspector = () => {
  const client = useQueryClient()
  const staleTime = client.getDefaultOptions().queries?.staleTime ?? 'undefined'
  return <div data-testid="stale-time">{String(staleTime)}</div>
}

describe('QueryProvider', () => {
  it('renders children', () => {
    render(
      <QueryProvider>
        <p>hello from child</p>
      </QueryProvider>
    )
    expect(screen.getByText('hello from child')).toBeInTheDocument()
  })

  it('provides a QueryClient to consumers', () => {
    render(
      <QueryProvider>
        <QueryClientInspector />
      </QueryProvider>
    )
    // If useQueryClient threw, the component would not render
    expect(screen.getByTestId('stale-time')).toBeInTheDocument()
  })

  it('query client has staleTime of 60 000 ms', () => {
    render(
      <QueryProvider>
        <QueryClientInspector />
      </QueryProvider>
    )
    expect(screen.getByTestId('stale-time').textContent).toBe('60000')
  })

  it('renders multiple children', () => {
    render(
      <QueryProvider>
        <span>one</span>
        <span>two</span>
      </QueryProvider>
    )
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })
})
