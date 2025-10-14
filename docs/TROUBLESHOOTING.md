# 🔧 CloakForge Troubleshooting Guide

> **Error handling patterns, common issues, and debugging strategies**

Last updated: 2025-10-14

## 📋 Table of Contents

- [Error Handling System](#error-handling-system)
- [Common Issues](#common-issues)
- [Debugging Strategies](#debugging-strategies)
- [Logging System](#logging-system)

---

## 🎯 Error Handling System

### Overview

CloakForge uses a **simplified, centralized error handling system** following our core principles:

- ✅ **KISS:** Simple error classes without over-engineering
- ✅ **DRY:** Reusable error handling utilities
- ✅ **Clear Purpose:** Each error class has specific responsibility
- ✅ **Developer-First:** User-friendly messages and structured logging
- ✅ **Maintainability:** Consistent patterns across all layers

### Error Classes

```tsx
// Base application error
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Solana-specific error
export class SolanaError extends AppError {
  constructor(message: string, code: string, status: number = 400) {
    super(code, message, status)
    this.name = 'SolanaError'
  }
}
```

### Error Codes

#### Common Error Codes

```typescript
// Wallet Errors
WALLET_NOT_CONNECTED = 'Please connect your wallet'
INSUFFICIENT_FUNDS = 'Not enough SOL for this transaction'
INVALID_WALLET_ADDRESS = 'Invalid wallet address format'

// Transaction Errors
TRANSACTION_FAILED = 'Transaction failed. Please try again'
BLOCKHASH_EXPIRED = 'Transaction expired. Please retry'
SIMULATION_FAILED = 'Transaction simulation failed'

// Network Errors
RPC_CONNECTION_FAILED = 'Unable to connect to Solana network'
RPC_RATE_LIMITED = 'Too many requests. Please wait'
NETWORK_ERROR = 'Network connection failed'

// Token Errors
TOKEN_NOT_FOUND = 'Token not found'
INSUFFICIENT_TOKEN_BALANCE = 'Insufficient token balance'
```

---

## 🐛 Common Issues

### Issue 1: Transaction Failing

**Symptoms:**

- Transaction rejected
- "Simulation failed" error
- Transaction times out

**Solutions:**

```tsx
// ✅ Always simulate before sending
try {
  const simulation = await connection.simulateTransaction(transaction)

  if (simulation.value.err) {
    logger.error('Simulation failed', {
      error: simulation.value.err,
      logs: simulation.value.logs,
    })
    throw new SolanaError('Transaction would fail. Please check your inputs.', 'SIMULATION_FAILED')
  }
} catch (error) {
  // Handle simulation error
}
```

**Common Causes:**

- Insufficient SOL for fees
- Invalid token account
- Missing authorities
- Blockhash expired

### Issue 2: RPC Rate Limiting

**Symptoms:**

- "429 Too Many Requests" errors
- Slow response times
- Random failures

**Solutions:**

```tsx
// ✅ Use private RPC for server operations
import { getServerConfig } from '@/lib/config/getServerConfig'

const serverConfig = getServerConfig()
const connection = new Connection(
  serverConfig.rpcPrivateEndpoint, // Private RPC
  'confirmed'
)

// ❌ Don't use public RPC on server
const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL!, // Public RPC
  'confirmed'
)
```

**Best Practices:**

- Server: Always use private RPC
- Client: Use wallet adapter's connection
- Implement retry logic with backoff
- Batch multiple RPC calls when possible

### Issue 3: Wallet Connection Issues

**Symptoms:**

- Wallet modal doesn't open
- Connected wallet not detected
- Multiple wallet disconnects

**Solutions:**

```tsx
// ✅ Check wallet connection before operations
import { useWallet } from '@solana/wallet-adapter-react'

function MyTool() {
  const { publicKey, connected } = useWallet()

  if (!connected || !publicKey) {
    throw new SolanaError('Please connect your wallet to continue', 'WALLET_NOT_CONNECTED')
  }

  // Continue with operation
}
```

**Common Causes:**

- Browser extension conflicts
- Wallet adapter not properly initialized
- Multiple wallet extensions installed
- Stale connection state

### Issue 4: Balance Validation Failures

**Symptoms:**

- "Insufficient funds" despite having balance
- Balance calculation incorrect
- Fee estimation wrong

**Solutions:**

```tsx
// ✅ Include ALL costs in validation
const estimatedCost =
  networkFee + // Network transaction fee
  serviceFee + // CloakForge service fee
  rentExemption + // Account rent if creating accounts
  tokenAmount // Token amount if transferring

// ✅ Use tool config for dynamic fees
const { config } = useToolConfig('my-tool')
const serviceFee = config?.baseFee ?? 0.01
const networkFee = config?.networkFee ?? 0.0005
```

**Best Practices:**

- Always include service fees
- Account for rent exemption
- Use latest blockhash for accurate fees
- Double-check on server side

### Issue 5: IPFS Upload Failures

**Symptoms:**

- "Failed to upload metadata" error
- Timeout on image upload
- IPFS gateway errors

**Solutions:**

```tsx
// ✅ Implement retry logic for IPFS
async function uploadWithRetry(file: File, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadToIPFS(file)
    } catch (error) {
      if (i === maxRetries - 1) throw error

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
}
```

**Common Causes:**

- Network connectivity issues
- IPFS service downtime
- File size too large
- Invalid Pinata JWT

---

## 🔍 Debugging Strategies

### Enable Debug Logging

```bash
# .env.local
LOG_LEVEL=debug
```

Then check console and server logs for detailed information.

### Hook Debugging

```tsx
export function useMyTool() {
  const logger = getLogger({
    context: 'my-tool',
    hook: 'useMyTool',
  })

  const execute = useCallback(async (params) => {
    logger.debug('Starting execution', { params })

    try {
      // Operation
      logger.info('Operation successful')
    } catch (error) {
      logger.error('Operation failed', error, { params })
      throw error
    }
  }, [])
}
```

### API Route Debugging

```tsx
export async function POST(request: NextRequest) {
  const logger = getLogger({ context: 'api', route: '/api/my-tool' })

  try {
    const body = await request.json()
    logger.debug('Request received', { body })

    // Process request

    logger.info('Request successful')
  } catch (error) {
    logger.error('Request failed', error)
  }
}
```

### Transaction Debugging

```tsx
// Log transaction before sending
logger.debug('Transaction details', {
  instructions: transaction.instructions.length,
  signers: transaction.signatures.length,
  recentBlockhash: transaction.recentBlockhash,
})

// Simulate to see what would happen
const simulation = await connection.simulateTransaction(transaction)
logger.debug('Simulation result', {
  err: simulation.value.err,
  logs: simulation.value.logs,
})
```

---

## 📊 Logging System

### Logger Setup

```tsx
import { getLogger } from '@/lib/logger/logger'

// Create contextual logger
const logger = getLogger({
  context: 'component-name', // Component or service name
  page: 'tools', // Optional: page location
  action: 'create-token', // Optional: specific action
})
```

### Log Levels

```tsx
// INFO: Successful operations, important state changes
logger.info('Token created successfully', {
  tokenAddress: '7xKXgRfk...',
  supply: 1000000,
})

// WARN: Recoverable issues, unusual situations
logger.warn('Rate limit approaching', {
  current: 8,
  limit: 10,
})

// ERROR: Failures requiring attention
logger.error('Token creation failed', error, {
  wallet: 'ABC123...',
  params: sanitizedParams,
})

// DEBUG: Detailed debugging information
logger.debug('Processing metadata', {
  metadata: tokenMetadata,
  step: 'validation',
})
```

### Best Practices

```tsx
// ✅ DO: Include relevant context
logger.error('Transaction failed', error, {
  wallet: walletAddress,
  tool: 'burn-tokens',
  amount: burnAmount,
  timestamp: new Date().toISOString(),
})

// ❌ DON'T: Log sensitive data
logger.error('Error', error, {
  privateKey: '...', // Never log private keys!
  password: '...', // Never log passwords!
})

// ✅ DO: Use structured data
logger.info('Operation complete', {
  duration: Date.now() - startTime,
  recordsProcessed: count,
  success: true,
})

// ❌ DON'T: Use string concatenation
logger.info('Processed ' + count + ' records in ' + duration + 'ms')
```

---

## 🚨 Error Handling Patterns

### Hook Layer

```tsx
export function useMyTool() {
  const executeMyTool = useCallback(async (context, params) => {
    try {
      // Validate inputs
      if (!params.amount || params.amount <= 0) {
        throw new SolanaError(
          'Amount must be greater than 0',
          'INVALID_AMOUNT'
        )
      }

      // Pre-flight checks
      const balance = await validateBalance(...)
      if (!balance.hasSufficientBalance) {
        throw new SolanaError(
          `Insufficient funds. Need ${balance.required} SOL`,
          'INSUFFICIENT_FUNDS'
        )
      }

      // Execute operation
      const result = await apiClient(...)

      return result

    } catch (error) {
      // Let useToolBase handle error processing
      throw error
    }
  }, [])

  // useToolBase provides consistent error handling
  const toolBase = useToolBase({ toolId: 'my-tool' }, executeMyTool)
  return { execute: toolBase.execute, ...toolBase }
}
```

### API Route Layer

```tsx
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request
    const validation = validateRequestBody(body, schema)
    if (!validation.success) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: validation.errors,
          data: null,
        },
        { status: 400 }
      )
    }

    // 2. Execute operation
    const result = await performOperation(validation.data)

    // 3. Return success
    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: result,
    })
  } catch (error) {
    logger.error('API error', error)

    // Handle known errors
    if (error instanceof SolanaError) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: error.status,
          error_message: error.message,
          data: null,
        },
        { status: error.status }
      )
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: 'An unexpected error occurred',
        data: null,
      },
      { status: 500 }
    )
  }
}
```

### Server Utility Layer

```tsx
export async function createMyTransaction(params) {
  try {
    // Validate inputs
    if (!params.walletAddress) {
      throw new SolanaError('Wallet address is required', 'INVALID_INPUT')
    }

    // Check balances
    const balance = await connection.getBalance(wallet)
    if (balance < requiredBalance) {
      throw new SolanaError(`Insufficient balance. Need ${required} SOL, have ${current} SOL`, 'INSUFFICIENT_FUNDS')
    }

    // Build transaction
    const transaction = new Transaction()
    // ... add instructions

    return { transaction }
  } catch (error) {
    logger.error('Transaction creation failed', error)

    // Re-throw with context
    if (error instanceof SolanaError) {
      throw error
    }

    throw new SolanaError('Failed to create transaction', 'TRANSACTION_CREATION_FAILED')
  }
}
```

---

## 🔧 Quick Fixes

### Reset Local State

```bash
# Clear browser localStorage
localStorage.clear()

# Clear tool config cache
localStorage.removeItem('tool-configs')

# Refresh page
location.reload()
```

### Check RPC Health

```tsx
import { Connection } from '@solana/web3.js'

async function checkRPCHealth(rpcUrl: string) {
  try {
    const connection = new Connection(rpcUrl)
    const slot = await connection.getSlot()
    logger.info('RPC healthy', { slot, rpcUrl })
    return true
  } catch (error) {
    logger.error('RPC unhealthy', error, { rpcUrl })
    return false
  }
}
```

### Force Wallet Reconnect

```tsx
import { useWallet } from '@solana/wallet-adapter-react'

function ForceReconnect() {
  const { disconnect, connect } = useWallet()

  const handleReconnect = async () => {
    await disconnect()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await connect()
  }

  return <button onClick={handleReconnect}>Reconnect Wallet</button>
}
```

---

## 📚 Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System design
- [Development Guide](./DEVELOPMENT.md) - Setup and workflow
- [Tooling Guide](./TOOLING.md) - Tool implementation

---

## 💡 Getting Help

**Still stuck?**

1. Check the console for error messages
2. Review logs with `LOG_LEVEL=debug`
3. Test on devnet first
4. Review reference implementations (Token Creator, Burn Tokens)
5. Check GitHub issues for similar problems

**Remember:**

- Errors are opportunities to improve
- Good error messages help everyone
- When in doubt, log it out!

---

**Built with ❤️ for the Solana ecosystem**
