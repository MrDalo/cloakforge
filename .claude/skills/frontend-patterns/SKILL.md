---
name: frontend-patterns
description: 'Next.js 16 App Router, React 19, component architecture, hooks, forms, and state management patterns for CloakForge. Use when: building UI pages or components, writing React hooks, implementing forms with validation, managing client/server state, deciding between server and client components, using the 5-layer tool architecture, working with shadcn/ui or Tailwind 4, or reviewing any frontend code for pattern compliance.'
---

# Frontend Patterns

## 5-Layer Tool Architecture

Every tool follows this exact structure — do not deviate:

```
src/app/tools/{tool}/page.tsx           → Route (thin wrapper, server component)
src/components/pages/{Tool}Page/        → Page component + form (client)
src/hooks/solana/use{Tool}.ts           → Client-side hook (wallet + API calls)
src/app/api/solana/{tool}/route.ts      → API route (server)
src/lib/solana/server-side/             → Server utility (transaction building)
```

Determine the task layer, then work only within that layer's file(s).

## Component Decision Tree

```
Does it use hooks, event handlers, or browser APIs?
  YES → 'use client'
  NO  → Server component (default)

Is it a cacheable server component or route handler?
  YES → 'use cache' + cacheLife() + cacheTag()
```

**React Compiler is enabled** — never add `useMemo`, `useCallback`, or `React.memo`. The compiler handles memoization automatically.

## Common Components — Check First

Before creating any new component, check `src/components/common/`:

| Component | Use For |
| --------- | ------- |
| `CustomFormField` | All RHF form fields — consistent labels, errors, layout |
| `InfoTooltip` | Technical term explanations (rent exemption, blockhash, etc.) |
| `ExplorerLink` | All Solana explorer links — handles formatting and a11y |
| `WalletConnectionButton` | Wallet connect/disconnect — do not build custom |
| `FeeBreakdown` | Fee display — semantic markup included |
| `FileUpload` | File upload with preview |
| `SelectedTokenDisplay` | Token info card |
| `LoadingSpinner` | Loading states — set `aria-label` prop |

## Forms

Use React Hook Form 8 + Zod 4. All schemas live in `src/lib/schemas/`.

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CustomFormField } from '@/components/common/CustomFormField'
import { mySchema, type MySchema } from '@/lib/schemas/mySchema'

export function MyForm() {
  const form = useForm<MySchema>({
    resolver: zodResolver(mySchema),
    defaultValues: { recipient: '', amount: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CustomFormField
          control={form.control}
          name="recipient"
          label="Recipient Address"
          placeholder="Solana wallet address"
        />
      </form>
    </Form>
  )
}
```

Rules:
- Validate on blur and submit (default RHF behavior with `mode: 'onBlur'`)
- Error display via `handleError()` from `@/lib/errors` — never raw error strings
- Preserve form state on API errors — do not reset unless success

## State Management

| State Type | Tool | Location |
| ---------- | ---- | -------- |
| Server/async | TanStack Query | `src/hooks/queries/` |
| Global client | Zustand | `src/stores/` |
| Form | React Hook Form | local to component |
| URL / filters | Next.js `searchParams` | page component |

Never store server data in Zustand — that is TanStack Query's job.

## React 19 Patterns

```tsx
// use() hook — unwrap promises and context in render
import { use } from 'react'
const data = use(somePromise)
const value = use(SomeContext)

// Server Actions — for mutations without API routes
async function saveAction(formData: FormData) {
  'use server'
  // runs on server, called from client
}

// useActionState — for form action state
const [state, action, isPending] = useActionState(saveAction, initialState)

// useOptimistic — for optimistic UI updates
const [optimisticItems, addOptimistic] = useOptimistic(items)
```

## Hook Pattern (Client Solana Hook)

```tsx
// src/hooks/solana/use{Tool}.ts
'use client'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { getLogger } from '@/lib/logger/logger'
import { handleError } from '@/lib/errors'

const logger = getLogger({ context: 'use{Tool}' })

export function use{Tool}() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()

  async function execute(params: Params) {
    // 1. Validate wallet connected
    // 2. Call API route for prepared transaction
    // 3. Deserialize, sign, send
    // 4. Confirm and return signature
  }

  return { execute, isPending, error, signature }
}
```

## Styling

- Tailwind 4 utility classes — mobile-first (`sm:`, `md:`, `lg:`)
- Dark mode: `dark:` variant — test both modes
- CSS variables for theming in `globals.css` — use `var(--color-*)` tokens
- shadcn/ui in `src/components/ui/` — never modify these files
- No inline styles unless dynamic values require it

## Import Rules

```tsx
// Solana — always barrel import
import { isValidSolanaAddress, LAMPORTS_PER_SOL } from '@/lib/solana'  // correct
import { isValidSolanaAddress } from '@/lib/solana/utils'              // wrong

// Errors
import { AppError, SolanaError, handleError } from '@/lib/errors'

// Logger
import { getLogger } from '@/lib/logger/logger'
```

For server component patterns, data fetching strategies, and caching details, see [references/server-patterns.md](references/server-patterns.md).
