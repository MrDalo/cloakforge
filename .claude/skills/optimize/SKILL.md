---
name: optimize
description: 'Audit and optimize application performance across bundle size, RPC efficiency, caching strategy, and Core Web Vitals (LCP, INP, CLS). Use when: (1) a page loads slowly or LCP exceeds 2.5s, (2) the production build shows oversized client bundles, (3) RPC calls are redundant, batched poorly, or hitting public endpoints on server, (4) missing `use cache` directives on static server components, (5) Core Web Vitals scores are below threshold in dev or Lighthouse audit. Prioritizes changes by impact then risk.'
disable-model-invocation: true
context: fork
---

# /optimize

Reference the `performance` knowledge skill for targets and techniques.
Read `docs/ARCHITECTURE.md` caching section on-demand.

## Process

1. **Analyze** — `npm run build`, inspect route sizes, `'use client'` boundaries, `'use cache'` usage, RPC patterns, images
2. **Identify** — categorize by impact:
   - P0: LCP > 2.5s (perception)
   - P1: INP > 200ms (interactivity)
   - P2: CLS > 0.1 (stability)
   - P3: Bundle > target (load time)
   - P4: Unnecessary RPC (cost + latency)
3. **Plan** — highest-impact, lowest-risk first:
   - Add `'use cache'` to static server components
   - Push `'use client'` boundary deeper
   - Dynamic import heavy components
   - Batch RPC calls
   - Optimize images
4. **Implement** — one optimization at a time, measure before/after
5. **Verify** — `npm run build && npm run lint:nowarn && npx tsc --noEmit && npm test`
6. **Report** — table of changes with before/after metrics
