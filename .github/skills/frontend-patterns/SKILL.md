# Frontend Patterns Skill

This skill provides patterns and best practices for frontend development in CloakForge using Next.js 16 App Router, React 19, Tailwind 4, and shadcn/ui.

## When to Use

Use this skill when building UI components, managing state, optimizing performance, or structuring frontend code.

## Next.js 16 App Router Patterns

### Route Structure
```
src/app/
  layout.tsx              → Root layout with providers
  page.tsx                → Home page
  error.tsx               → Error boundary
  global-error.tsx        → Global error boundary
  tools/
    token-creator/
      page.tsx            → Tool route page
    burn-tokens/
      page.tsx            → Tool route page
  api/
    solana/
      token-creator/
        route.ts          → API route handler
```

### Cache Components (Next.js 16)
```tsx
// Server component with caching
'use cache';
import { cacheLife, cacheTag } from 'next/cache';

export default async function ToolConfig() {
  cacheLife('days');       // Cache for days (tool configs rarely change)
  cacheTag('tool-config'); // Tag for targeted revalidation
  
  const config = await fetchToolConfig();
  return <ConfigDisplay config={config} />;
}
```

Cache TTL strategy:
- `cacheLife('days')` — tool configs, CMS content
- `cacheLife('minutes')` — Solana SOL price
- `cacheLife('seconds')` — token data, balances

### React Compiler
React Compiler is enabled — **no manual memoization needed**:
- ❌ Don't use `useMemo`, `useCallback`, `React.memo` for optimization
- ✅ The compiler handles memoization automatically
- ✅ React Hook Form v8 is fully compatible with React Compiler

## Component Design

### CloakForge Component Hierarchy
```
src/components/
  common/          → Reusable across all pages (30+ components)
  pages/           → Page-specific components (one per tool)
  ui/              → shadcn/ui primitives (25 components)
```

### Component Template (Arrow Function)
```tsx
interface Props {
  // Explicit, documented props
}

const ComponentName = ({ prop1, prop2 }: Props) => {
  // Loading state
  // Error state
  // Empty state
  // Main render
};

export { ComponentName };
```

### Component Sizing
- **Small** (<50 lines) — UI primitives in `src/components/ui/`
- **Medium** (50-150 lines) — Feature components in `src/components/common/`
- **If >150 lines** — split into subcomponents in a directory

### Composition with shadcn/ui
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

<Card>
  <CardHeader>
    <CardTitle>Token Creator</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Tool form */}
  </CardContent>
</Card>
```

## State Management

### Where State Lives
```
React Hook Form (useForm)     → Form inputs, validation
TanStack Query (useQuery)     → Server data, caching, background refresh
Zustand (useStore)            → Client-side shared state (tool config store)
URL searchParams              → Shareable state (filters, pagination)
useState                      → Local UI state (open/closed, hover)
```

### Rules
- Server data (token info, balances) → TanStack Query, never `useState`
- Form state → React Hook Form + Zod, never manual state
- Tool config → Zustand store (loaded from Contentful)
- Don't put everything in global state — start local, lift only when needed

## Form Patterns (React Hook Form 8 + Zod 4)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { burnTokenSchema, type BurnTokenFormData } from '@/lib/schemas/burnToken';

const BurnTokenForm = () => {
  const form = useForm<BurnTokenFormData>({
    resolver: zodResolver(burnTokenSchema),
    defaultValues: { amount: '', tokenMint: '' },
  });

  return (
    <UnifiedForm form={form} onSubmit={handleSubmit}>
      <CustomFormField control={form.control} name="tokenMint" label="Token" />
      <CustomFormField control={form.control} name="amount" label="Amount" />
      <ToolActionButton toolId="burn-tokens" isPending={isPending} />
    </UnifiedForm>
  );
};
```

## Error Handling

### Error Classes
```tsx
import { AppError, SolanaError } from '@/lib/errors';
import { handleError } from '@/lib/errors';

// In hooks — throw to useToolBase
throw new SolanaError('Insufficient balance', 'INSUFFICIENT_BALANCE');

// In UI — display user-friendly message
const message = handleError(error);
toast.error(message);
```

### Error Boundaries
- `src/app/error.tsx` — route-level error boundary
- `src/app/global-error.tsx` — app-level error boundary
- Always provide retry action and user-friendly message

## File Structure for New Tools

```
src/app/tools/my-tool/page.tsx                     → Route page
src/app/api/solana/my-tool/route.ts                → API route
src/components/pages/MyToolPage/
  index.tsx                                         → Page component
  MyToolForm/index.tsx                              → Form component
  FAQSection/index.tsx                              → FAQ section
src/hooks/solana/useMyTool.ts                       → Client hook
src/lib/solana/server-side/createMyToolTransaction.ts → Server utility
src/lib/schemas/myTool.ts                           → Zod schema
src/types/myTool.ts                                 → TypeScript types
```

## TypeScript Best Practices

- Define props interfaces for all components
- No `any` — use `unknown` and narrow, or specific Solana types
- Import from `@/lib/solana` barrel export, never individual files
- Export types alongside their components
- Use `PublicKey` type from `@solana/web3.js` for addresses
- Use strict Zod schemas for all external inputs

## Performance Patterns

### Bundle Optimization
- Dynamic imports for heavy components: `React.lazy(() => import('./HeavyComponent'))`
- `optimizePackageImports` in `next.config.ts` for Solana, Lucide, etc.
- `@next/bundle-analyzer` available via `npm run analyze`

### Rendering
- React Compiler handles memoization — don't optimize prematurely
- Use `Suspense` boundaries for async components
- Lazy load below-the-fold content
- Use `sharp` for image optimization (already configured)
