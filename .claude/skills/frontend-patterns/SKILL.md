---
name: frontend-patterns
description: 'Next.js 16 App Router, React 19, and component design patterns for CloakForge. Use when building UI, pages, components, hooks, or forms.'
---

# Frontend Patterns

## Component Rules

- Default to server components — `'use client'` only for hooks, events, or browser APIs
- React Compiler enabled — no `useMemo`, `useCallback`, `React.memo`
- `'use cache'` + `cacheLife()` + `cacheTag()` for cacheable server components
- `use()` hook for promises and context (React 19)
- Check `src/components/common/` before creating new components

## Forms

- React Hook Form 8 + Zod 4 schemas from `src/lib/schemas/`
- `CustomFormField` for consistent field rendering
- Validate on blur and submit
- Error display via `handleError()` from `@/lib/errors`

## State Management

- Server state: TanStack Query (`src/hooks/queries/`)
- Client state: Zustand (`src/stores/`)
- Form state: React Hook Form
- URL state: Next.js searchParams

## Styling

- Tailwind 4 + CSS variables in `globals.css`
- Dark mode via `dark:` variant, mobile-first
- shadcn/ui in `src/components/ui/` — never modify
