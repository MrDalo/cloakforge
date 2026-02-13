---
name: optimize
description: 'Audit and optimize performance — bundle size, RPC efficiency, caching, Core Web Vitals'
disable-model-invocation: true
context: fork
---

# /optimize — Performance Optimization

## Before Starting

Load the performance knowledge:

- Reference the `performance` skill for targets and techniques
- Read @docs/ARCHITECTURE.md for caching strategy

## Process

### Step 1: Analyze

Gather current performance data:

```bash
npm run build          # Check build output sizes
```

Inspect:

- Route segment sizes (`.next/` output)
- Client component boundaries (`'use client'` directives)
- Server component caching (`'use cache'` usage)
- RPC call patterns in `src/lib/solana/`
- Image handling (next/image usage)

### Step 2: Identify Issues

Categorize by impact:

| Priority | Category        | Impact on        |
| -------- | --------------- | ---------------- |
| P0       | LCP > 2.5s      | User perception  |
| P1       | INP > 200ms     | Interactivity    |
| P2       | CLS > 0.1       | Visual stability |
| P3       | Bundle > target | Load time        |
| P4       | Unnecessary RPC | Cost + latency   |

### Step 3: Plan by Impact

Start with highest-impact, lowest-risk optimizations:

1. Add `'use cache'` to static server components
2. Move `'use client'` boundary deeper
3. Dynamic import heavy components
4. Batch RPC calls
5. Optimize images

### Step 4: Implement

- Make one optimization at a time
- Measure before and after
- Verify no regressions

### Step 5: Verify

```bash
npm run build          # Compare output sizes
npm run lint:nowarn    # Zero warnings
npx tsc --noEmit      # Zero type errors
npm test              # All tests pass
```

### Step 6: Report

Document changes and impact:

```
## Optimization Results
| Change | Before | After | Impact |
|--------|--------|-------|--------|
| ... | ... | ... | ... |
```
