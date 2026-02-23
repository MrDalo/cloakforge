# CloakForge Architecture

## Mission

Privacy-first, professional-grade Solana token management suite.

**Core Values:**

- Zero data collection (no tracking, analytics, or user data storage)
- Low fees, transparent pricing
- Hardware wallet support, multi-signature transactions
- Mobile-first, responsive, accessible

**Core Tools:**
Token Creator, Token Burner, Freeze/Unfreeze, Authority Management, Multi-Sender (up to 500 recipients), Create Liquidity, Portfolio Tracker

## Tech Stack

**Frontend:** Next.js 16 (App Router), React 19 (React Compiler enabled — no manual memoization), TypeScript 5+ (strict)

**Styling:** Tailwind 4 + shadcn/ui

**Blockchain:** @solana/web3.js, @solana/kit, @solana/spl-token, @solana/wallet-adapter

**State:** TanStack Query (server), Zustand (client), React Hook Form 8 + Zod 4

**Infrastructure:** Pino (logging), Pinata (IPFS), Contentful (CMS, optional), ESLint (zero warnings), Husky (git hooks)

## Hybrid Architecture

**Client-side:**

- Transaction signing (wallet adapter)
- Balance validation (pre-flight)
- Transaction submission
- UI state

**Server-side:**

- Transaction preparation (unsigned)
- Fee calculation
- Validation (ownership, balances)
- Private RPC (NO public RPC on server)

### RPC Strategy

| Endpoint        | Location   | Usage                                                       |
| --------------- | ---------- | ----------------------------------------------------------- |
| Public RPC      | Client     | Transaction submission, balance checks (via wallet adapter) |
| **Private RPC** | **Server** | **Transaction prep, validation — NEVER use public RPC**     |

## Provider Hierarchy

```tsx
<AppProvider toolConfigs={toolConfigs}>
  <ConfigProvider>
    {' '}
    {/* Env config, RPC endpoints, feature flags */}
    <SolanaProvider>
      {' '}
      {/* Wallet adapter, multi-wallet, auto-connect */}
      <QueryProvider>
        {' '}
        {/* TanStack Query, cache, retry logic */}
        <ToolConfigProvider>
          {' '}
          {/* Contentful config, 5-min cache */}
          {children}
        </ToolConfigProvider>
      </QueryProvider>
    </SolanaProvider>
  </ConfigProvider>
</AppProvider>
```

## Project Structure

```
src/
│   ├── app/                      # Next.js App Router
│   │   ├── tools/                # Tool-specific pages
│   │   │   ├── token-creator/
│   │   │   ├── burn-tokens/
│   │   │   ├── freeze-accounts/
│   │   │   └── transaction-multisender/
│   │   ├── api/                  # API routes
│   │   │   ├── solana/           # Solana-specific endpoints
│   │   │   ├── log/              # Client logging endpoint
│   │   │   └── site-banner/      # Contentful banner config
│   │   ├── account/              # Portfolio tracker
│   │   └── layout.tsx            # Root layout with providers
│   │
│   ├── components/               # React components
│   │   ├── common/               # 20+ reusable components
│   │   │   ├── InfoTooltip/
│   │   │   ├── ExplorerLink/
│   │   │   ├── LoadingSpinner/
│   │   │   ├── WalletConnectionButton/
│   │   │   └── ...               # CHECK HERE FIRST!
│   │   ├── pages/                # Page-specific components
│   │   │   └── [ToolName]Page/
│   │   │       ├── index.tsx
│   │   │       ├── [ToolName]Form/
│   │   │       └── FAQSection/
│   │   └── ui/                   # shadcn/ui base components
│   │
│   ├── lib/                      # Business logic & utilities
│   │   ├── solana/               # Solana operations
│   │   │   ├── address.ts        # Address validation & formatting
│   │   │   ├── balance.ts        # Balance checks & conversions
│   │   │   ├── transactions.ts   # Transaction building & confirmation
│   │   │   ├── rpc.ts            # RPC connection management
│   │   │   ├── tokens.ts         # Token metadata utilities
│   │   │   ├── index.ts          # Barrel export (use this!)
│   │   │   ├── createToken.ts    # Tool-specific utilities
│   │   │   ├── burnToken.ts
│   │   │   ├── utils.ts          # (deprecated, use index.ts)
│   │   │   └── ...
│   │   ├── logger/               # Centralized logging
│   │   ├── config/               # Configuration management
│   │   ├── ipfs/                 # IPFS metadata storage
│   │   ├── toast/                # User feedback system
│   │   └── utils/                # General utilities
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── queries/              # TanStack Query hooks
│   │   ├── mutations/            # Mutation hooks
│   │   └── solana/               # Solana-specific hooks
│   │
│   ├── providers/                # React context providers
│   │   ├── AppProvider.tsx       # Main provider wrapper
│   │   ├── SolanaProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   └── ToolConfigProvider.tsx
│   │
│   ├── stores/                   # Zustand state stores
│   │   └── toolConfigStore.ts
│   │
│   └── types/                    # TypeScript definitions
│       ├── api.ts
│       ├── error.ts
│       ├── config.ts
│       └── ...
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # This file
│   ├── DEVELOPMENT.md            # Development guide
│   ├── TOOLING.md                # Tool implementation
│   └── TROUBLESHOOTING.md        # Error handling
│
└── public/                       # Static assets
```

```
src/
  ├── app/                    # Next.js App Router
  │   ├── tools/              # token-creator, burn-tokens, freeze-wallets, transaction-multisender
  │   ├── api/solana/         # Solana endpoints
  │   └── layout.tsx          # Root with providers
  │
  ├── components/
  │   ├── common/             # 20+ reusable (CHECK HERE FIRST!)
  │   │   └── InfoTooltip, ExplorerLink, WalletConnectionButton, FeeBreakdown, FileUpload, CustomFormField
  │   ├── pages/              # Page-specific
  │   └── ui/                 # shadcn/ui (never modify)
  │
  ├── lib/
  │   ├── solana/
  │   │   ├── index.ts        # Barrel export (ALWAYS use this)
  │   │   ├── server-side/    # Server utilities ('server-only')
  │   │   └── address, balance, transactions, rpc, tokens modules
  │   ├── schemas/            # Zod validation
  │   ├── errors/             # AppError, SolanaError
  │   ├── logger/             # Pino logger
  │   ├── config/             # Config management
  │   └── ipfs/               # Pinata integration
  │
  ├── hooks/
  │   ├── solana/             # useTokenCreator, etc.
  │   └── queries/            # TanStack Query hooks
  │
  ├── stores/                 # Zustand (global state)
  ├── types/                  # TypeScript types
  └── providers/              # React providers
```

## Data Flow

### Tool Execution Flow

```
1. User fills form (React Hook Form + Zod validation)
2. Form submits to useToolHook
3. Hook validates wallet + SOL balance (client)
4. Hook calls /api/solana/{tool} (server)
5. API route validates input with Zod
6. Server utility prepares unsigned transaction (private RPC)
7. API returns serialized transaction (base64)
8. Hook deserializes + wallet signs transaction
9. Hook submits signed transaction to network
10. Hook confirms transaction
11. Hook returns signature + explorer link
```

### Error Flow

```
1. Error occurs in any layer
2. Thrown as AppError or Sol anaError
3. Caught by hook or API route
4. Logged with getLogger()
5. User-friendly message via handleError()
6. Toast notification shown to user
```

## Core Conventions

- **Import from barrels** — `@/lib/solana`, not individual files
- **Errors** — `AppError` / `SolanaError` from `@/lib/errors`, `handleError()` for user messages
- **Logging** — `getLogger({ context: '...' })` from `@/lib/logger/logger`
- **Server** — `'server-only'` directive + `rpcPrivateEndpoint` from `getServerConfig()`
- **No `any`** — strict TypeScript enforced
- **Zero lint warnings** — `npm run lint:nowarn` must pass
- **No manual memoization** — React Compiler handles it (`useMemo`, `useCallback`, `React.memo` forbidden)
- **Check `src/components/common/` first** — 20+ reusable components, avoid duplication

## Component Patterns

**Common Component Pattern:**

```tsx
import { InfoTooltip, LoadingSpinner, ExplorerLink } from '@/components/common'
```

**Tool Integration:**

```tsx
const { execute, isExecuting } = useToolName()
<ToolNameForm onSubmit={execute} />
<LoadingSpinner /> {/* When executing */}
<ExplorerLink signature={result} /> {/* On success */}
```

**API Route Pattern:**

```tsx
export async function POST(request: NextRequest) {
  try {
    const validated = schema.parse(await request.json())
    const result = await performOperation(validated)
    return NextResponse.json({ status: 'success', data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
```

## Caching (Next.js 16)

**Pattern:**

```typescript
import { cacheLife, cacheTag } from 'next/cache'

export async function getData() {
  'use cache'
  cacheLife('minutes') // or  'seconds', 'hours', 'days', 'max'
  cacheTag('my-data')

  const data = await fetchFromAPI()
  return data
}
```

**Cache Durations:**
| Type | Profile | Duration | Use Case |
|------|---------|----------|----------|
| Tool configs | `days` | 1 day | Rarely change |
| Site banner | `days` | 1 day | Webhook revalidates |
| Solana price | `minutes` | 2 min | Frequent updates |
| Token data | `seconds` | 30 sec | Real-time blockchain |

**Revalidation:**

```typescript
import { revalidateTag } from 'next/cache'
revalidateTag('tool-configs', 'max') // Stale-while-revalidate
```

## React Hook Form 8

**v8.0.0-alpha.5** — Native React Compiler support (no `'use no memo'` needed).

## Security

- Client-side transaction signing
- Server validates ownership + balances beforehand
- Multi-layer validation (Zod + Solana PublicKey)
- Hardware wallet support
- Zero key storage server-side

## Performance

- Private RPC server-side (no rate limits)
- Next.js 16 caching for server data
- React Query for client data
- Route-based code splitting
- Lazy componentloading

## References

- [DEVELOPMENT.md](./DEVELOPMENT.md) — Setup, standards
- [TOOLING.md](./TOOLING.md) — 5-layer tool pattern
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Error handling