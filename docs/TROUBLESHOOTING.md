# CloakForge Troubleshooting Guide

## Error Handling System

**Error Classes:**

```tsx
import { AppError, SolanaError } from '@/lib/errors'

// Application errors
throw new AppError('Operation failed', 'OPERATION_FAILED', 500)

// Blockchain errors
throw new SolanaError('Insufficient funds', 'INSUFFICIENT_FUNDS')
```

**Common Error Codes:**
| Code | Message | Layer |
|------|---------|-------|
| `WALLET_NOT_CONNECTED` | Connect wallet first | Client |
| `INSUFFICIENT_FUNDS` | Not enough SOL | Client |
| `TRANSACTION_FAILED` | Transaction failed | Client |
| `SIMULATION_FAILED` | Simulation failed | Server |
| `RPC_CONNECTION_FAILED` | RPC unreachable | Server |
| `TOKEN_NOT_FOUND` | Token not found | Server |

## Common Issues

### Transaction Failing

**Cause:** Insufficient balance, expired blockhash, or simulation failure

**Fix:**

```tsx
// Check balance before API call
const balance = await connection.getBalance(publicKey)
if (balance < estimatedCost) {
  throw new SolanaError('Insufficient funds', 'INSUFFICIENT_FUNDS')
}

// Simulate transaction
const simulation = await connection.simulateTransaction(transaction)
if (simulation.value.err) {
  logger.error('Simulation failed', simulation.value.logs)
  throw new SolanaError('Simulation failed', 'SIMULATION_FAILED')
}
```

### RPC Rate Limiting

**Cause:** Using public RPC for too many requests

**Fix:**

```tsx
// ✅ Server-side: Use private RPC
const { rpcPrivateEndpoint } = getServerConfig()
const connection = new Connection(rpcPrivateEndpoint)

// ✅ Client-side: Use wallet adapter connection (already uses public RPC)
const { connection } = useConnection()
```

### Wallet Not Connecting

**Cause:** Wallet adapter configuration issue or user hasn't installed wallet

**Fix:**

```tsx
// Check wallet is installed
if (!publicKey || !signTransaction) {
  toast.error('Please connect a Solana wallet')
  return
}

// Log wallet info for debugging
logger.debug('Wallet connected', {
  publicKey: publicKey.toBase58(),
  walletName: wallet?.adapter.name,
})
```

### Form Validation Not Working

**Cause:** React Hook Form + React Compiler issue (in RHF v7)

**Fix:**

```tsx
// ✅ Use RHF v8 (already configured in package.json)
"react-hook-form": "^8.0.0-alpha.5"

// React Compiler now works without 'use no memo'
```

### TypeScript Errors

**Cause:** Implicit `any` types or missing type definitions

**Fix:**

```tsx
// ✅ Always type catch blocks
catch (error: unknown) {
  if (error instanceof Error) {
    logger.error(error.message)
  }
}

// ✅ Use Zod inference
export type MyToolFormData = z.infer<typeof myToolSchema>
```

### ESLint Warnings

**Cause:** Unused variables, missing dependencies, or implicit types

**Fix:**

```bash
# Auto-fix where possible
npm run lint:fix

# Manual fix for missing dependencies
const execute = useCallback(async () => {
  // ...
}, [publicKey, connection])  #  Add all dependencies
```

## Debugging Strategies

**Enable debug logging:**

```bash
# .env.local
LOG_LEVEL=debug
```

**Check logs in browser:**

```tsx
// Temporary debugging (remove before commit)
console.log('[DEBUG]', { variable })
```

**Use React Query DevTools:**
Already integrated in development mode — open DevTools and find React Query tab for server state inspection.

**Check transaction logs:**

```tsx
const signature = await connection.sendTransaction(transaction)
const txLogs = await connection.getTransaction(signature, {
  commitment: 'confirmed',
  maxSupportedTransactionVersion: 0,
})
logger.debug('Transaction logs', txLogs?.meta?.logMessages)
```

**Simulate transactions:**

```tsx
const simulation = await connection.simulateTransaction(transaction)
logger.debug('Simulation result', {
  err: simulation.value.err,
  logs: simulation.value.logs,
  unitsConsumed: simulation.value.unitsConsumed,
})
```

## Logging System

**Setup:**

```tsx
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'my-component' })
```

**Usage:**

```tsx
logger.debug('Debug info', { data })
logger.info('User action', { action: 'submit' })
logger.warn('Potential issue', { warning })
logger.error('Error occurred', { error })
```

**Log Levels:**
| Level | When to Use |
|-------|-------------|
| `debug` | Development debugging input |
| `info` | User actions, key events |
| `warn` | Non-critical issues |
| `error` | Errors, exceptions |

**Structured Logging:**

```tsx
// ✅ Include context
logger.error('Transaction failed', {
  error,
  signature,
  publicKey: publicKey.toBase58(),
  timestamp: Date.now(),
})

// ❌ Bare message
logger.error('failed')
```

## User-Facing Error Messages

**handleError utility:**

```tsx
import { handleError } from '@/lib/errors/handleError'

try {
  // Operation
} catch (error) {
  const message = handleError(error)
  toast.error(message)
}
```

**Custom user messages:**

```tsx
catch (error: unknown) {
  if (error instanceof SolanaError) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      toast.error('Not enough SOL', {
        description: 'Add SOL to your wallet and try again'
      })
      return
    }
  }

  // Fallback to handleError
  toast.error(handleError(error))
}
```

## Error Pattern by Layer

**Hook Layer:**

```tsx
try {
  // Operation
  toast.success('Success!')
} catch (error) {
  logger.error('Operation failed', { error })
  toast.error(handleError(error))
  throw error // Re-throw for component error boundary
}
```

**API Route Layer:**

```tsx
try {
  // Operation
  return NextResponse.json({ data })
} catch (error) {
  logger.error('API error', { error })
  const appError = AppError.from(error)
  return NextResponse.json({ error: appError.message }, { status: appError.statusCode })
}
```

**Server Utility Layer:**

```tsx
try {
  // Operation
  return transaction
} catch (error) {
  logger.error('Server utility failed', { error })
  throw new SolanaError('Transaction prep failed', 'TRANSACTION_PREP_FAILED')
}
```

## Performance Issues

**Slow RPC calls:**

```tsx
// Use private RPC server-side
const { rpcPrivateEndpoint } = getServerConfig()

// Batch requests where possible
const [balance, tokenAccounts] = await Promise.all([
  connection.getBalance(publicKey),
  connection.getParsedTokenAccountsByOwner(publicKey, { programId }),
])
```

**Large bundle size:**

```bash
# Analyze bundle
npm run build
# Check .next/analyze/ for bundle report
```

**Slow page loads:**

```tsx
// Use Next.js caching
export async function getData() {
  'use cache'
  cacheLife('minutes')
  cacheTag('my-data')

  return await fetchData()
}
```

## Security Issues

**Exposed private keys:**
**NEVER** store or log private keys/mnemonics. All signing happens client-side in user's wallet.

**Exposed RPC endpoints:**

```bash
# ✅ Correct: Public RPC public, private RPC server-only
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
RPC_PRIVATE_ENDPOINT=https://my-private-rpc.com  # Server-only

# ❌ Wrong: Private RPC exposed
NEXT_PUBLIC_RPC_PRIVATE=https://my-private-rpc.com
```

**Client-side secrets:**
Never put sensitive values in `NEXT_PUBLIC_*` variables — they're exposed to browser.

## Testing on Devnet

**Switch to devnet:**

```bash
# .env.local
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

**Get devnet SOL:**

```bash
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet
```

**Test checklist:**

- [ ] Transaction creation works
- [ ] Fee calculation accurate
- [ ] Error handling proper
- [ ] Success/error feedback shown
- [ ] Explorer links valid
- [ ] Different wallet types tested
- [ ] Edge cases covered (insufficient balance, invalid input, etc.)

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Setup, standards
- [TOOLING.md](./TOOLING.md) — Tool implementation
