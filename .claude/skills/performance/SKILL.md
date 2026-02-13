---
name: performance
description: 'Bundle optimization, Solana RPC efficiency, Core Web Vitals, and caching strategies for CloakForge. Use when optimizing performance, troubleshooting slow pages, or configuring caching.'
---

# Performance Skill

## Core Web Vitals Targets

| Metric | Target  | Measure                   |
| ------ | ------- | ------------------------- |
| LCP    | < 2.5s  | Largest Contentful Paint  |
| INP    | < 200ms | Interaction to Next Paint |
| CLS    | < 0.1   | Cumulative Layout Shift   |

## Next.js 16 Caching

### `'use cache'` Directive

- Apply to server components that render static or slow-changing data
- Apply to route handlers that return cacheable data
- Apply to server actions that perform read operations

### Cache Configuration

```typescript
import { cacheLife, cacheTag } from 'next/cache'

async function getData() {
  'use cache'
  cacheLife('hours')
  cacheTag('my-data')
  // ... fetch data
}
```

### Cache Invalidation

```typescript
import { revalidateTag } from 'next/cache'
revalidateTag('my-data')
```

### Static vs Dynamic

- **Static**: Pages without dynamic data → build-time generation
- **Dynamic**: Pages with wallet-dependent data → request-time rendering
- **ISR**: Pages with slowly changing data → `cacheLife('hours')`

## Bundle Optimization

- Use dynamic imports for heavy components: `dynamic(() => import(...))`
- Default to server components (no JS sent to client)
- Lazy load tool pages (each tool is its own route)
- Keep `'use client'` boundary as low as possible

## Solana RPC Optimization

- **Batch requests**: Use `getMultipleAccountsInfo` instead of multiple `getAccountInfo`
- **Cache metadata**: Token metadata changes rarely — cache aggressively
- **Use WebSocket**: For real-time balance updates, prefer WebSocket over polling
- **Rate limiting**: Respect rate limits on private RPC
- **Minimize round trips**: Combine related queries into single requests

## Image Optimization

- Use `next/image` for all images
- Always provide `width` and `height`
- Use `priority` on above-the-fold images
- Prefer WebP/AVIF formats
- Use `sizes` attribute for responsive images
