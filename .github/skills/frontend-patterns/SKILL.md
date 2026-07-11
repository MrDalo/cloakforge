---
name: frontend-patterns
description: "Next.js 16 App Router, React 19, and component design patterns for CloakForge. Use when building UI, pages, components, hooks, or forms."
---

# Frontend Patterns Skill

## Next.js 16 App Router

### File Conventions
- `page.tsx` — route segment UI
- `layout.tsx` — shared UI wrapper
- `loading.tsx` — loading UI (Suspense boundary)
- `error.tsx` — error UI (Error Boundary)
- `not-found.tsx` — 404 UI

### Server vs Client Components
- **Default to server components** — no directive needed
- `'use client'` — only when using hooks, event handlers, or browser APIs
- `'use cache'` — for cacheable server components

### React 19 Features
- React Compiler enabled — **no manual memoization**
- Server Actions for mutations
- `use()` hook for promises and context
- Improved error boundaries

## Component Architecture

### 5-Layer Tool Pattern
```
src/app/tools/{tool}/page.tsx           → Route (thin wrapper)
src/components/pages/{Tool}Page/        → Page component + form
src/hooks/solana/use{Tool}.ts           → Client-side logic
src/app/api/solana/{tool}/route.ts      → API route
src/lib/solana/server-side/             → Server utility
```

### Common Components (check FIRST)
Located in `src/components/common/`:
- `InfoTooltip` — technical term explanations
- `ExplorerLink` — Solana explorer links
- `WalletConnectionButton` — wallet connect
- `FeeBreakdown` — fee display
- `FileUpload` — file upload with preview
- `CustomFormField` — RHF form field wrapper
- `SelectedTokenDisplay` — token info card
- `LoadingSpinner` — loading indicator

### Forms
- React Hook Form 8 + Zod 4
- Schemas in `src/lib/schemas/`
- `CustomFormField` for consistent field rendering
- Validate on blur and submit

### State Management
- Server state: TanStack Query
- Client state: Zustand (`src/stores/`)
- Form state: React Hook Form
- URL state: searchParams

## Styling
- Tailwind 4 utilities
- CSS variables in `globals.css`
- Dark mode via `dark:` variant
- Mobile-first responsive design
- shadcn/ui primitives (never modify)
