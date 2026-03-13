# Server Component and Caching Patterns

## Server vs Client Component Rules

| Needs | Component Type |
| ----- | -------------- |
| Data fetching, DB, secrets | Server component |
| Wallet adapter, wallet hooks | Client component |
| Event handlers (`onClick`, etc.) | Client component |
| Browser APIs (`window`, `localStorage`) | Client component |
| Static layout / no interactivity | Server component |
| `useEffect`, `useState` | Client component |

## Caching Patterns (Next.js 16)

```tsx
// Cacheable server component
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'

export async function TokenList() {
  'use cache'
  cacheLife('hours')        // 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks'
  cacheTag('token-list')    // for on-demand revalidation

  const tokens = await fetchTokens()
  return <ul>{tokens.map(t => <li key={t.mint}>{t.name}</li>)}</ul>
}

// Invalidate from Server Action
import { revalidateTag } from 'next/cache'
revalidateTag('token-list')
```

## Route Handler Caching

```tsx
// app/api/solana/{tool}/route.ts
export async function GET() {
  'use cache'
  cacheLife('minutes')
  // ...
}
```

## Data Fetching in Server Components

```tsx
// Parallel data fetching — do not await sequentially
const [tokens, balance] = await Promise.all([
  fetchTokens(address),
  fetchBalance(address),
])

// Streaming with Suspense
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner aria-label="Loading token list" />}>
      <TokenList />
    </Suspense>
  )
}
```

## Page Architecture Pattern

```tsx
// app/tools/{tool}/page.tsx — server component, thin wrapper
import { {Tool}Page } from '@/components/pages/{Tool}Page'

export const metadata = { title: '{Tool} | CloakForge' }

export default function Page() {
  return <{Tool}Page />
}

// components/pages/{Tool}Page/index.tsx — may be client or server
// If form is present → 'use client'
// If display only → server component
```

## Error Boundaries

```tsx
// app/tools/{tool}/error.tsx
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div role="alert">
      <p>Something went wrong</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Loading UI

```tsx
// app/tools/{tool}/loading.tsx
export default function Loading() {
  return <LoadingSpinner aria-label="Loading tool" />
}
```
