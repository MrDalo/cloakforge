# Performance Optimization Skill

This skill provides patterns for identifying and resolving performance bottlenecks in CloakForge.

## When to Use

Use this skill when optimizing application performance, profiling, reducing load times, improving Solana RPC efficiency, or tuning Next.js caching.

## Performance Mindset

1. **Measure first** — never optimize without profiling
2. **Set baselines** — record current metrics before changes
3. **Target bottlenecks** — optimize the slowest part, not everything
4. **Verify improvement** — measure again after changes

## Next.js 16 Performance

### Cache Components Strategy
```tsx
'use cache';
import { cacheLife, cacheTag } from 'next/cache';

// Tool configs — rarely change
cacheLife('days');
cacheTag('tool-config');

// Solana SOL price — updates frequently
cacheLife('minutes');
cacheTag('sol-price');

// Token data — changes often
cacheLife('seconds');
cacheTag('token-data');
```

Cache invalidation via webhook:
```typescript
import { revalidateTag } from 'next/cache';
revalidateTag('tool-config'); // Targeted revalidation
```

### In-Memory Cache
`next.config.ts` sets `cacheMaxMemorySize: 50 * 1024 * 1024` (50MB).

### React Compiler
- Enabled in `next.config.ts` — handles memoization automatically
- ❌ Don't add `useMemo`, `useCallback`, `React.memo` for optimization
- ✅ Trust the compiler to optimize renders

### Bundle Size
- Use `npm run analyze` (`ANALYZE=true next build`) for bundle analysis
- `optimizePackageImports` configured for: `lucide-react`, `@solana/web3.js`, `@solana/kit`, `@solana/spl-token`, etc.
- Dynamic import heavy components: `React.lazy(() => import('./Chart'))`
- Code-split at route level (App Router does this automatically)

### Core Web Vitals Targets
| Metric | Good | Description |
|--------|------|-------------|
| LCP | <2.5s | Largest Contentful Paint |
| INP | <200ms | Interaction to Next Paint |
| CLS | <0.1 | Cumulative Layout Shift |

## Solana RPC Performance

### Private vs Public RPC
```
Server-side → ALWAYS private RPC (no rate limits, faster)
Client-side → Public RPC via wallet adapter (acceptable for balance checks, tx submission)
```

### RPC Call Optimization
- **Batch requests** — combine multiple RPC calls where possible
- **Cache responses** — use TanStack Query's `staleTime` for token data
- **Avoid redundant calls** — check if data already in cache
- **Use `getMultipleAccountsInfo`** instead of multiple `getAccountInfo` calls

### TanStack Query Cache
```typescript
const { data: tokens } = useQuery({
  queryKey: ['wallet-tokens', publicKey?.toBase58()],
  queryFn: () => getWalletTokens(connection, publicKey),
  staleTime: 30_000, // 30 seconds
  refetchOnWindowFocus: false,
});
```

### Transaction Optimization
- Set `maxRetries` and `skipPreflight` judiciously
- Use `confirmTransaction` with appropriate commitment (`confirmed` for speed, `finalized` for safety)
- Minimize instruction count per transaction (Solana compute limits)
- For multi-sender: batch recipients into optimal transaction groups

## Frontend Performance

### Rendering
- React Compiler handles render optimization automatically
- Use `Suspense` boundaries for async server components
- Lazy load below-the-fold components
- Provide `width`/`height` to Next.js `Image` to prevent CLS

### Loading States
- Use `skeleton` components from shadcn/ui during data loading
- Provide immediate feedback for wallet actions
- Show progress for multi-step transactions

### Images
- Use Next.js `Image` component with `sharp` (configured)
- Remote patterns configured for `ctfassets.net` and `mypinata.cloud`
- Use `loading="lazy"` for below-the-fold images
- Use `priority` for above-the-fold hero images

## Logging Performance

- Use `pino` (configured) — fast structured logging
- `pino-pretty` for development only
- Set appropriate `LOG_LEVEL` — don't log debug in production
- `serverExternalPackages: ['pino', 'pino-pretty']` in next.config

## Anti-Patterns

- ❌ Manual `useMemo`/`useCallback` (React Compiler handles it)
- ❌ Public RPC calls on server-side (use private RPC)
- ❌ Fetching all tokens when only one is needed
- ❌ No `staleTime` on TanStack Query (causes excessive RPC calls)
- ❌ `console.log` in production (use structured logging)
- ❌ Synchronous Solana calls in UI thread
- ❌ Missing loading states during blockchain confirmation
