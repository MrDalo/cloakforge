---
name: performance
description: 'Bundle optimization, Solana RPC efficiency, Core Web Vitals, and caching strategies for CloakForge. Use when optimizing performance, troubleshooting slow pages, or configuring caching.'
---

# Performance

## Core Web Vitals Targets

| Metric | Target  |
| ------ | ------- |
| LCP    | < 2.5s  |
| INP    | < 200ms |
| CLS    | < 0.1   |

## Next.js 16 Caching

- `'use cache'` on server components with static or slow-changing data
- `cacheLife('hours')` + `cacheTag('my-data')` for ISR
- `revalidateTag('my-data')` for invalidation
- Wallet-dependent pages are dynamic (request-time rendering)

## Bundle Optimization

- Dynamic imports for heavy components: `dynamic(() => import(...))`
- Default to server components (no JS sent to client)
- Keep `'use client'` boundary as deep as possible
- Each tool page is its own route (automatic code splitting)

## Solana RPC Optimization

- Batch: `getMultipleAccountsInfo` over multiple `getAccountInfo`
- Cache token metadata aggressively (rarely changes)
- WebSocket for real-time balance updates over polling
- Respect private RPC rate limits
- Minimize round trips — combine related queries

## Images

- `next/image` with `width`, `height`, and `sizes`
- `priority` on above-the-fold images
- Prefer WebP/AVIF
