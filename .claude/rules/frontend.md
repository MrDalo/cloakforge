---
globs: src/app/**/*.{ts,tsx}, src/components/**/*.{ts,tsx}, src/hooks/**/*.{ts,tsx}
description: Frontend conventions for Next.js 16 App Router, React 19, and component design
---

## React 19 + Next.js 16 Rules

- React Compiler is enabled — **no manual memoization** (`useMemo`, `useCallback`, `React.memo`)
- Use `'use client'` only when component uses hooks, event handlers, or browser APIs
- Use `'use cache'` for cacheable server components and route handlers
- Prefer server components by default

## Component Architecture (5-Layer Tool Pattern)

```
src/app/tools/{tool}/page.tsx           → Route (thin wrapper)
src/components/pages/{Tool}Page/        → Page component + form
src/hooks/solana/use{Tool}.ts           → Client-side logic
src/app/api/solana/{tool}/route.ts      → API route
src/lib/solana/server-side/             → Server utility
```

## Common Components (check FIRST before creating)

Located in `src/components/common/`:

- `InfoTooltip` — technical term explanations
- `ExplorerLink` — Solana explorer links
- `WalletConnectionButton` — wallet connect
- `FeeBreakdown` — fee display
- `FileUpload` — file upload with preview
- `CustomFormField` — RHF form field wrapper
- `SelectedTokenDisplay` — token info card
- `LoadingSpinner` — loading indicator

## Forms

- React Hook Form 8 + Zod 4 schemas from `src/lib/schemas/`
- Use `CustomFormField` for consistent field rendering
- Validate on blur and submit

## State Management

- Server state: TanStack Query (`src/hooks/queries/`)
- Client state: Zustand (`src/stores/`)
- Form state: React Hook Form
- URL state: Next.js searchParams

## Styling

- Tailwind 4 utility classes
- CSS variables for theming (defined in `globals.css`)
- Dark mode support via `dark:` variant
- Mobile-first responsive design
- shadcn/ui primitives in `src/components/ui/` — never modify these
