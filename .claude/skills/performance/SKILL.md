---
name: performance
description: Bundle optimization, Solana RPC efficiency, Core Web Vitals, and caching strategies for CloakForge. Use when optimizing application performance, troubleshooting slow pages, configuring caching strategies, analyzing bundle size, optimizing Solana RPC calls, improving Core Web Vitals scores, or investigating performance bottlenecks in Web3 applications.
---

# Performance Optimization

Comprehensive performance strategy for CloakForge's Web3 application.

## Performance Audit Process

### 1. Measure Current State
```bash
# Lighthouse audit
npx lighthouse http://localhost:3001 --view

# Bundle analysis
npm run build && npm run analyze

# Core Web Vitals monitoring
npm run dev # Check Network tab for RPC calls
```

### 2. Identify Bottlenecks

**Check these areas:**
- Bundle size (`npm run analyze`)
- RPC call frequency (Network tab)
- Rendering performance (React DevTools Profiler)
- Cache effectiveness (Application tab)

### 3. Apply Optimizations

Follow systematic optimization strategies below.

## Core Web Vitals Targets

| Metric | Target | CloakForge Optimization |
|--------|---------|------------------------|
| LCP | < 2.5s | Server components + image optimization |
| INP | < 200ms | React Compiler + minimal re-renders |
| CLS | < 0.1 | Fixed layouts + skeleton loading |

## Next.js 16 Performance Patterns

### Caching Strategy
```typescript
// Server component with caching
import { cache } from 'react'
import 'use cache'

export async function TokenMetadata({ mintAddress }: { mintAddress: string }) {
  cacheLife('hours')
  cacheTag('token-metadata')

  const metadata = await fetchTokenMetadata(mintAddress)
  return <div>{metadata.name}</div>
}
```

### Code Splitting
```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Client-only if needed
})
```

## Solana RPC Optimization

### Batch Operations
```typescript
// Instead of multiple getAccountInfo calls
const accounts = await connection.getMultipleAccountsInfo([
  address1, address2, address3
])

// Batch token account queries
const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
  walletAddress,
  { programId: TOKEN_PROGRAM_ID }
)
```

### Smart Caching
```typescript
// Cache token metadata aggressively
const tokenMetadataCache = new Map()

async function getTokenMetadata(mintAddress: string) {
  if (tokenMetadataCache.has(mintAddress)) {
    return tokenMetadataCache.get(mintAddress)
  }

  const metadata = await fetchMetadata(mintAddress)
  tokenMetadataCache.set(mintAddress, metadata)
  return metadata
}
```

## Bundle Optimization

### Client Boundary Optimization
```typescript
// Keep 'use client' as deep as possible
export default function ServerComponent() {
  return (
    <div>
      <h1>Server rendered content</h1>
      <ClientOnlyWidget /> {/* Only this needs 'use client' */}
    </div>
  )
}
```

### Tree Shaking
```typescript
// Import specific functions only
import { PublicKey } from '@solana/web3.js'
// Not: import * as web3 from '@solana/web3.js'

// Use barrel imports for internal modules
import { createTransaction, validateAddress } from '@/lib/solana'
```

## Performance Monitoring

### Key Metrics to Track
- **Bundle Size**: Keep main bundle < 200KB gzipped
- **RPC Calls**: < 10 calls per user action
- **Time to Interactive**: < 3s on 3G
- **Memory Usage**: No memory leaks in SPA navigation

### Monitoring Tools
- **Built-in**: `npm run analyze` for bundle analysis
- **Runtime**: React DevTools Profiler
- **Production**: Core Web Vitals monitoring

## Images

- `next/image` with `width`, `height`, and `sizes`
- `priority` on above-the-fold images
- Prefer WebP/AVIF formats

## Common Performance Issues

### Bundle Bloat
- **Cause**: Importing entire libraries, unused dependencies
- **Fix**: Tree shaking, dynamic imports, bundle analysis

### RPC Overhead
- **Cause**: Too many individual RPC calls
- **Fix**: Batch operations, caching, WebSocket subscriptions

### Unnecessary Re-renders
- **Cause**: Poor state management, prop drilling
- **Fix**: React Compiler handles this automatically

## Performance Resources

### Detailed Optimization Guide
- **Optimization Checklist**: See [references/optimization-checklist.md](references/optimization-checklist.md) for comprehensive step-by-step optimization process

## Performance Checklist

- [ ] Bundle size analyzed and optimized
- [ ] RPC calls batched where possible
- [ ] Server components used by default
- [ ] Images optimized with next/image
- [ ] Caching strategy implemented
- [ ] Core Web Vitals targets met
- [ ] Performance regression tests in place
