---
name: performance
description: "Bundle optimization, Solana RPC efficiency, Core Web Vitals, and caching strategies for CloakForge. Use when optimizing performance, troubleshooting slow pages, or configuring caching."
---

# Performance Skill

## Core Web Vitals

- **LCP** < 2.5s — Optimize largest content paint
- **INP** < 200ms — Optimize interaction to next paint
- **CLS** < 0.1 — Minimize layout shift

## Next.js 16 Caching

### Cache Components
- `'use cache'` directive for cacheable server components
- `cacheLife('hours')` / `cacheLife('days')` for TTL
- `cacheTag('tag')` for on-demand revalidation
- `revalidateTag('tag')` to bust specific caches

### Static vs Dynamic
- Prefer static rendering where possible
- Use `generateStaticParams()` for known routes
- Dynamic rendering only when user-specific data needed

## Bundle Optimization

- Use dynamic imports for heavy components: `dynamic(() => import(...))`
- Keep client bundles small — server components by default
- Analyze with `npm run build` output
- Tree-shake unused exports

## Solana RPC Optimization

- Batch RPC calls when possible
- Use `getMultipleAccountsInfo` over multiple `getAccountInfo`
- Cache token metadata (rarely changes)
- Use WebSocket subscriptions for real-time data (confirmations)

## Image Optimization

- Always use `next/image` component
- Specify `width` and `height` or use `fill`
- Use `priority` for above-fold images
- WebP/AVIF format (automatic with next/image)
