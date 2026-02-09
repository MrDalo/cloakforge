---
name: Optimize
description: 'Audit and optimize performance — bundle size, RPC efficiency, Core Web Vitals, caching'
agent: Conductor
---

Audit and optimize the specified area of CloakForge for performance. Follow this process:

1. **Analyze** — identify performance bottlenecks using:
   - `npm run build` output (bundle sizes)
   - Lighthouse audit (Core Web Vitals)
   - Component tree analysis (unnecessary re-renders)
   - RPC call patterns (batching, caching)
2. **Plan** — prioritize fixes by impact (LCP > INP > CLS)
3. **Implement** — delegate to `frontend` or `backend` subagent
4. **Verify** — measure before/after, confirm no regressions
5. **Review** — delegate to `review` subagent

Key strategies:

- `'use cache'` + `cacheLife()` for server component caching
- Dynamic imports for heavy client components
- `next/image` for all images
- Batch Solana RPC calls with `getMultipleAccountsInfo`
- Prefer server components to reduce client bundle

Reference the `performance` skill for detailed patterns.

The user will describe what they want optimized, or say "audit" for a full scan.
