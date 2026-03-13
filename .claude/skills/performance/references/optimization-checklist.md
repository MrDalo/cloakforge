# Performance Optimization Checklist

## Pre-Optimization Assessment

### Measurement Tools
- [ ] Lighthouse audit completed (`npx lighthouse http://localhost:3001 --view`)
- [ ] Bundle analysis run (`npm run build && npm run analyze`)
- [ ] Network tab analysis (RPC call frequency)
- [ ] React DevTools Profiler trace captured
- [ ] Core Web Vitals baseline established

### Performance Bottleneck Identification
- [ ] **Bundle Size**: Main bundle > 200KB gzipped?
- [ ] **RPC Calls**: > 10 calls per user interaction?
- [ ] **Rendering**: Unnecessary re-renders detected?
- [ ] **Images**: Unoptimized images found?
- [ ] **Caching**: Cache hit rate < 80%?

## Bundle Optimization Checklist

### Code Splitting
- [ ] Heavy components use dynamic imports
```typescript
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />
})
```

- [ ] Tool pages are separate routes (automatic splitting)
- [ ] Third-party libraries are properly tree-shaken

### Client Boundary Optimization
- [ ] Server components used by default
- [ ] `'use client'` only where necessary
- [ ] Client boundaries as deep as possible

```typescript
// Good: Only interactive part is client-side
export default function ServerPage() {
  return (
    <div>
      <h1>Server-rendered header</h1>
      <InteractiveWidget /> {/* Only this needs 'use client' */}
    </div>
  )
}
```

### Import Optimization
- [ ] Specific imports over wildcard imports
```typescript
// Good
import { PublicKey } from '@solana/web3.js'

// Bad
import * as web3 from '@solana/web3.js'
```

- [ ] Barrel imports for internal modules
```typescript
import { createTransaction, validateAddress } from '@/lib/solana'
```

## Solana RPC Optimization Checklist

### Batch Operations
- [ ] Multiple `getAccountInfo` calls replaced with `getMultipleAccountsInfo`
- [ ] Token accounts fetched in batch
- [ ] Related queries combined into single request

```typescript
// Before: Multiple calls
const account1 = await connection.getAccountInfo(address1)
const account2 = await connection.getAccountInfo(address2)

// After: Batch call
const [account1, account2] = await connection.getMultipleAccountsInfo([
  address1, address2
])
```

### Caching Strategy
- [ ] Token metadata cached aggressively (rarely changes)
- [ ] Account data cached with appropriate TTL
- [ ] RPC responses cached in memory

```typescript
const metadataCache = new Map()
async function getCachedMetadata(mintAddress: string) {
  if (metadataCache.has(mintAddress)) {
    return metadataCache.get(mintAddress)
  }
  // Fetch and cache...
}
```

### Connection Management
- [ ] Single connection instance reused
- [ ] WebSocket subscriptions for real-time updates
- [ ] Private RPC rate limits respected

## Next.js 16 Caching Optimization

### Server Component Caching
- [ ] Static data uses `'use cache'`
- [ ] Appropriate cache lifetime set (`cacheLife('hours')`)
- [ ] Cache tags implemented for invalidation

```typescript
import 'use cache'

export async function TokenPrice({ symbol }: { symbol: string }) {
  cacheLife('minutes')
  cacheTag(`token-price-${symbol}`)

  const price = await fetchTokenPrice(symbol)
  return <span>${price}</span>
}
```

### Route-Level Caching
- [ ] Static pages cached at build time
- [ ] Dynamic pages with ISR where appropriate
- [ ] Cache invalidation strategy implemented

## Image Optimization Checklist

### Next.js Image Component
- [ ] `next/image` used for all images
- [ ] `width` and `height` provided
- [ ] `sizes` attribute set for responsive images
- [ ] `priority` set for above-the-fold images

```typescript
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="CloakForge Hero"
  width={1200}
  height={600}
  priority
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Image Formats
- [ ] WebP/AVIF formats preferred
- [ ] Progressive JPEG for large images
- [ ] SVG for icons and simple graphics

## Core Web Vitals Optimization

### Largest Contentful Paint (LCP) < 2.5s
- [ ] Hero images optimized and prioritized
- [ ] Critical CSS inlined
- [ ] Server components reduce client-side rendering
- [ ] Font loading optimized

### Interaction to Next Paint (INP) < 200ms
- [ ] React Compiler enabled (automatic optimization)
- [ ] Event handlers debounced where appropriate
- [ ] Heavy computations moved to web workers

### Cumulative Layout Shift (CLS) < 0.1
- [ ] Image dimensions specified
- [ ] Skeleton loading states implemented
- [ ] Font fallbacks prevent layout shifts

```typescript
// Skeleton loading prevents layout shift
function TokenListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  )
}
```

## Performance Testing Checklist

### Automated Testing
- [ ] Lighthouse CI integrated
- [ ] Bundle size regression tests
- [ ] Core Web Vitals monitoring

### Manual Testing
- [ ] 3G network simulation tested
- [ ] Mobile device performance verified
- [ ] Memory leaks checked during navigation

## Monitoring & Metrics

### Key Performance Indicators
- [ ] Bundle size < 200KB gzipped
- [ ] Time to Interactive < 3s
- [ ] RPC calls per action < 10
- [ ] Cache hit rate > 80%
- [ ] Core Web Vitals all green

### Ongoing Monitoring
- [ ] Performance budget established
- [ ] Regression detection automated
- [ ] Performance alerts configured

## Performance Budget

| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| Main Bundle | < 200KB | [Measure] | 🟢/🟡/🔴 |
| LCP | < 2.5s | [Measure] | 🟢/🟡/🔴 |
| INP | < 200ms | [Measure] | 🟢/🟡/🔴 |
| CLS | < 0.1 | [Measure] | 🟢/🟡/🔴 |
| RPC Calls/Action | < 10 | [Measure] | 🟢/🟡/🔴 |

## Post-Optimization Verification

### Re-measurement
- [ ] Lighthouse audit re-run
- [ ] Bundle analysis re-run
- [ ] Core Web Vitals re-measured
- [ ] User experience tested

### Documentation
- [ ] Optimization changes documented
- [ ] Performance metrics tracked
- [ ] Regression prevention measures noted