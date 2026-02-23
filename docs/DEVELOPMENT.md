# CloakForge Development Guide

## Quick Start

```bash
git clone https://github.com/MrDalo/cloakforge.git
cd cloakforge
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev  # → http://localhost:3001
```

## Environment Config

```bash
# .env.local
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
RPC_PRIVATE_ENDPOINT=<private_rpc>  # REQUIRED for server
PINATA_JWT=<jwt>                    # Token Creator
PINATA_GATEWAY_URL=https://gateway.pinata.cloud
LOG_LEVEL=info
```

## Scripts

| Command               | Purpose                |
| --------------------- | ---------------------- |
| `npm run dev`         | Dev server (port 3001) |
| `npm run build`       | Production build       |
| `npm run lint:nowarn` | Zero-warnings lint     |
| `npm run type-check`  | TypeScript check       |
| `npm test`            | Run all tests          |
| `npm run test:watch`  | Watch mode             |

## Code Standards

**TypeScript:**

- Strict mode enforced
- No `any` types
- Explicit return types on functions

**React:**

- No manual memoization (React Compiler enabled)
- `'use client'` only when using hooks/events
- `'use cache'` for server components with caching

**Imports:**

- Barrel imports from `@/lib/solana` (never individual files)
- Absolute paths with `@/` alias

**Error Handling:**

- `AppError` / `SolanaError` from `@/lib/errors`
- `handleError()` for user messages
- `getLogger({ context: '...' })` for logging

**Server-side:**

- `'server-only'` directive required
- `rpcPrivateEndpoint` from `getServerConfig()` (NEVER public RPC)
- No user data storage

## Component Patterns

**Check `src/components/common/` first** — 20+ reusable components:

- `InfoTooltip`, `ExplorerLink`, `WalletConnectionButton`, `FeeBreakdown`, `FileUpload`, `CustomFormField`, `LoadingSpinner`

**Consistent structure:**

```tsx
// ComponentName/index.tsx
export { ComponentName } from './ComponentName'

// ComponentName/ComponentName.tsx
interface Props { /* ... */ }
export function ComponentName({ ... }: Props) { /* ... */ }
```

## Forms (React Hook Form 8 + Zod 4)

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { mySchema } from '@/lib/schemas'

const form = useForm({
  resolver: zodResolver(mySchema),
  mode: 'onBlur', // Validate on blur
})
```

Use `CustomFormField` from `@/components/common` for consistent field rendering.

## State Management

| Type         | Library              | Use Case            |
| ------------ | -------------------- | ------------------- |
| Server state | TanStack Query       | API data fetching   |
| Client state | Zustand              | Global UI state     |
| Form state   | React Hook Form      | Forms               |
| URL state    | Next.js searchParams | Filters, pagination |

## Testing

**Test Pyramid:**

- 70% unit tests (utilities, schemas)
- 20% component tests (RTL)
- 8% integration tests (API routes, hooks)
- 2% E2E (critical paths)

**Run tests:**

```bash
npm test                 # All tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

**What to test:**

- Server utilities (validation, TX building, error cases) — HIGH
- API routes (request/response shapes, errors, status codes) — HIGH
- Schemas (valid/invalid inputs, edge cases) — HIGH
- Hooks (state transitions, loading, errors) — MEDIUM
- Components (user interactions, conditional rendering) — MEDIUM

**What not to test:**

- shadcn/ui internals
- React Compiler optimizations
- Third-party library behavior

## Git Workflow

**Conventional Commits:**

```bash
feat(tool-name): add new feature
fix(component): resolve bug
refactor(hooks): simplify state logic
docs(guide): update setup steps
```

**Branch naming:**

```bash
feature/tool-name
fix/component-issue
refactor/state-management
```

## Quality Gates

**Before commit:**

```bash
npm run lint:nowarn && npx tsc --noEmit
```

Zero ESLint warnings required. Husky pre-commit hook enforces this.

## Project Structure

```
src/
├── app/
│   ├── tools/                    # Tool pages (token-creator, burn-tokens, etc.)
│   ├── api/solana/               # Solana API routes
│   └── layout.tsx                # Root with providers
├── components/
│   ├── common/                   # CHECK HERE FIRST (20+ reusable)
│   ├── pages/                    # Page-specific components
│   └── ui/                       # shadcn/ui (never modify)
├── lib/
│   ├── solana/
│   │   ├── index.ts              # Barrel (ALWAYS use this)
│   │   ├── server-side/          # Server utilities ('server-only')
│   │   └── address, balance, transactions, rpc, tokens modules
│   ├── schemas/                  # Zod validation
│   ├── errors/                   # AppError, SolanaError
│   ├── logger/                   # Pino logger
│   └── config/                   # Config management
├── hooks/
│   ├── solana/                   # useTokenCreator, etc.
│   └── queries/                  # TanStack Query hooks
├── stores/                       # Zustand stores
├── types/                        # TypeScript definitions
└── providers/                    # React providers
```

## Common Tasks

**Add new tool:**
See [TOOLING.md](./TOOLING.md) for 5-layer implementation pattern.

**Add component:**
Check `src/components/common/` for existing before creating new one.

**Add API route:**

```tsx
// src/app/api/solana/{tool}/route.ts
import 'server-only'
import { getServerConfig } from '@/lib/config/serverConfig'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'api/{tool}' })

export async function POST(request: NextRequest) {
  try {
    const { rpcPrivateEndpoint } = getServerConfig()
    // Build unsigned transaction
    return NextResponse.json({ transaction: serializedTx })
  } catch (error) {
    logger.error('Failed', { error })
    return NextResponse.json({ error: appError.message }, { status: appError.statusCode })
  }
}
```

**Add Zod schema:**

```tsx
// src/lib/schemas/{tool}.ts
import { z } from 'zod'
import { isValidSolanaAddress } from '@/lib/solana'

export const mySchema = z.object({
  walletAddress: z.string().refine(isValidSolanaAddress, 'Invalid Solana address'),
  amount: z.number().positive(),
})
```

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [TOOLING.md](./TOOLING.md) — Tool implementation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Error handling
