# 🚀 Error Handling Strategy for Solana Web3 Application

## 📋 Overview

This comprehensive error handling strategy provides robust error management across all layers of your Next.js Solana Web3 application. The system implements a **two-tier error code architecture** that handles both generic application errors and domain-specific Solana/crypto errors with user-friendly messages and detailed logging.

## � Hybrid Error Message Fallback (2025-09)

**New behavior:**

- When you throw a `SolanaError` or `AppError` with only an error code (e.g. `new SolanaError(SOLANA_ERROR_CODES.BURN_AMOUNT_EXCEEDS_BALANCE)`), the system will automatically show the user-friendly message for that code (e.g. "Cannot burn more tokens than you own.").
- If you throw with a custom message (e.g. `new SolanaError('Custom message', SOLANA_ERROR_CODES.BURN_AMOUNT_EXCEEDS_BALANCE)`), the custom message is shown to the user.
- This fallback is handled centrally in `getUserErrorMessageFromError.ts` and applies to all error toasts and UI error displays.

**Why?**

- This makes error handling more developer-friendly: you only need to provide a code for standard errors, and you get a user-friendly message for free. You can still override with a custom message for special cases.

**How it works:**

1. If the error message equals the error code, the system treats it as "no custom message" and shows the user-friendly message for that code.
2. If a custom message is provided, it is shown as-is.
3. If neither is available, a generic HTTP status message is shown.

**Example:**

```typescript
throw new SolanaError(SOLANA_ERROR_CODES.BURN_AMOUNT_EXCEEDS_BALANCE)
// User sees: "Cannot burn more tokens than you own."

throw new SolanaError('You cannot burn more than your balance!', SOLANA_ERROR_CODES.BURN_AMOUNT_EXCEEDS_BALANCE)
// User sees: "You cannot burn more than your balance!"
```

## �🏗️ Architecture Overview

```
Error Handling Flow
├── HTTP Status Codes (200, 400, 404, 500...)
├── Generic App Error Codes (UNAUTHORIZED, INVALID_EMAIL...)
├── Domain-Specific Error Codes (WALLET_NOT_CONNECTED, TRANSACTION_FAILED...)
├── Smart Message Routing (getDomainErrorMessage)
├── User-Friendly Messages (getAppErrorMessage, getSolanaErrorMessage)
└── Centralized Error Processing (getUserErrorMessageFromError)
```

### **Core Components**

1. **Error Types** (`src/types/error.ts`) - Type definitions and base structures
2. **Error Codes** (`src/lib/utils/appErrorCodes.ts`, `solanaErrorCodes.ts`) - Centralized error code constants
3. **Message Handlers** (`src/lib/utils/getAppErrorMessage.ts`, `getSolanaErrorMessage.ts`) - User-friendly message generation
4. **Error Processing** (`src/lib/utils/getUserErrorMessageFromError.ts`) - Main error processing function

- Implements the hybrid fallback: if the error message equals the code, shows the user-friendly message for that code.

5. **API Response Handler** (`src/lib/utils/handleApiResponse.ts`) - Standardized API response processing
6. **Logging System** (`src/lib/logger/logger.ts`) - Centralized logging with server/client separation

## 🔧 Error Type System

### **Base Types** (`src/types`)

```
export class HTTPError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'HTTPError'
    this.status = status
  }
}

export class SolanaError extends HTTPError {
  code: string
  constructor(messageOrCode: string, code?: string, status: number = 400) {
    if (code === undefined) {
      // Only one argument: treat as code and use as message
      super(messageOrCode, status)
      this.code = messageOrCode
    } else {
      super(messageOrCode, status)
      this.code = code
    }
    this.name = 'SolanaError'
  }
}

// Hybrid fallback logic in getUserErrorMessageFromError.ts:
// If error.message === error.code, show user-friendly message for that code.
// If error.message !== error.code, show the custom message.
```

export class HTTPError extends Error {
status: number
constructor(message: string, status: number) {
super(message)
this.name = 'HTTPError'
this.status = status
}
}

````

### **Generic Application Error Codes**

```typescript
export const APP_ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation Errors
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  FIELD_TOO_SHORT: 'FIELD_TOO_SHORT',

  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // Network & Server
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',

  // ... 50+ total error codes
}
````

### **Solana-Specific Error Codes**

```typescript
export const SOLANA_ERROR_CODES = {
  // Wallet Operations
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_WALLET_ADDRESS: 'INVALID_WALLET_ADDRESS',

  // Transaction Lifecycle
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_EXPIRED: 'TRANSACTION_EXPIRED',
  BLOCKHASH_EXPIRED: 'BLOCKHASH_EXPIRED',
  SIMULATION_FAILED: 'SIMULATION_FAILED',

  // Token Operations
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  INSUFFICIENT_TOKEN_BALANCE: 'INSUFFICIENT_TOKEN_BALANCE',

  // Network & RPC
  RPC_RATE_LIMITED: 'RPC_RATE_LIMITED',
  WRONG_NETWORK: 'WRONG_NETWORK',

  // ... 40+ total Solana-specific codes
}
```

## 📝 Enhanced Centralized Logging System

### **Logger Architecture** (`src/lib/logger/logger.ts`)

The application uses a sophisticated centralized logging system that automatically adapts to server and client environments with enhanced error serialization and human-readable timestamps:

```typescript
// Server-side: Uses Pino with enhanced error handling and ISO timestamps
// Client-side: Sends logs to /api/log endpoint with error serialization

import { getLogger } from '@/lib/logger/logger'

// Create contextual logger instances
const logger = getLogger({
  context: 'api',
  route: '/api/users',
  userId: '123',
})

logger.info('User login attempt', { email: 'user@example.com' })
logger.warn('Rate limit approaching', { attempts: 8, limit: 10 })
logger.error('Database connection failed', error, {
  requestId: 'req_123',
  action: 'userLogin',
})
logger.debug('Processing user data', { userData })
```

### **Enhanced Logger Features**

✅ **Environment Detection** - Automatic server/client behavior  
✅ **Contextual Logging** - Rich metadata for debugging  
✅ **Enhanced Error Serialization** - Detailed error information with stack traces  
✅ **Human-Readable Timestamps** - ISO 8601 format (`2025-07-24T23:00:01.218Z`)  
✅ **Multiple Error Types Support** - Axios, Fetch, Validation errors  
✅ **Stack Trace Capture** - Complete call stack for debugging  
✅ **Error Type Detection** - Automatic error type identification  
✅ **Nested Error Support** - Handles error causes and chains  
✅ **Type Safety** - Full TypeScript support  
✅ **Centralized Collection** - Client logs sent to server  
✅ **Production Ready** - Structured JSON logs in production

### **Logger Configuration**

#### **Environment Variables**

```bash
# .env.local
LOG_LEVEL=info  # debug, info, warn, error
```

#### **Server Logger Configuration**

The server logger automatically configures itself with enhanced features:

```typescript
// Automatic configuration in getServerLogger()
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Enhanced error serialization with stack traces
  serializers: {
    error: serializeError, // Custom serializer for detailed error info
  },
  // Human-readable ISO timestamps instead of unix timestamps
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
})
```

### **Enhanced Error Serialization**

The logger automatically detects and handles different error types:

```typescript
// Example error log output
{
  "level": 50,
  "time": "2025-07-24T23:00:01.218Z",
  "context": "api",
  "route": "/api/tokens",
  "error": {
    "message": "Network request failed",
    "type": "AxiosError",
    "stack_trace": "Error: Network request failed\n    at request (/api/tokens.ts:45:12)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)",
    "code": "ECONNREFUSED",
    "status": 500,
    "request": {
      "method": "POST",
      "url": "/api/external-service",
      "baseURL": "https://api.example.com"
    },
    "response": {
      "status": 500,
      "statusText": "Internal Server Error",
      "data": { "error": "Service unavailable" }
    }
  },
  "requestId": "req_123",
  "action": "createToken",
  "msg": "Failed to create token"
}
```

### **Supported Error Types**

1. **Axios Errors** - HTTP client errors with request/response details
2. **Fetch Errors** - Native fetch API errors
3. **Validation Errors** - Form and data validation errors
4. **Generic Errors** - Standard JavaScript errors with stack traces
5. **Custom Errors** - Application-specific error types

### **Logger Usage Patterns**

```typescript
// API Routes with enhanced error context
const logger = getLogger({ context: 'api', route: '/api/tokens' })

// Components with action tracking
const logger = getLogger({ context: 'TokenCreator', action: 'createToken' })

// Services with detailed context
const logger = getLogger({ context: 'solana', service: 'transaction' })

// Error Boundaries with page context
const logger = getLogger({ context: 'error-boundary', page: 'dashboard' })

// Hooks with query tracking
const logger = getLogger({ context: 'query', hook: 'useTokenBalance' })
```

## 💡 Usage Patterns by Layer

### **1. API Route Handlers with Enhanced Logging**

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { getAppErrorMessage } from '@/lib/utils/getAppErrorMessage'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import { getLogger } from '@/lib/logger/logger'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger({
    context: 'api',
    route: '/api/users',
    method: 'POST',
  })

  try {
    const body = await request.json()
    logger.info('Creating user', { email: body.email })

    // Validation with specific error codes
    if (!body.email) {
      logger.warn('Missing email field', { requestBody: body })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: getAppErrorMessage(APP_ERROR_CODES.MISSING_REQUIRED_FIELD),
          error_code: APP_ERROR_CODES.MISSING_REQUIRED_FIELD,
          data: null,
        },
        { status: 400 }
      )
    }

    if (!body.email.includes('@')) {
      logger.warn('Invalid email format', { email: body.email })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: getAppErrorMessage(APP_ERROR_CODES.INVALID_EMAIL),
          error_code: APP_ERROR_CODES.INVALID_EMAIL,
          data: null,
        },
        { status: 400 }
      )
    }

    // Business logic here...
    const user = await createUser(body)
    logger.info('User created successfully', { userId: user.id, email: user.email })

    return NextResponse.json({
      status: 'success',
      status_code: 201,
      error_message: '',
      data: user,
    })
  } catch (error) {
    // Enhanced error logging with detailed context
    logger.error('Failed to create user', error, {
      requestId: request.headers.get('x-request-id'),
      action: 'createUser',
      userAgent: request.headers.get('user-agent'),
    })

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: getUserErrorMessageFromError(error),
        error_code: APP_ERROR_CODES.INTERNAL_ERROR,
        data: null,
      },
      { status: 500 }
    )
  }
}
```

#### **Enhanced Error Log Output Example**

```json
{
  "level": 50,
  "time": "2025-07-24T23:15:42.891Z",
  "pid": 12345,
  "hostname": "app-server",
  "context": "api",
  "route": "/api/users",
  "method": "POST",
  "error": {
    "message": "Connection timeout",
    "type": "AxiosError",
    "stack_trace": "Error: Connection timeout\n    at createUser (/lib/services/user.ts:23:15)\n    at POST (/app/api/users/route.ts:45:22)",
    "code": "ECONNABORTED",
    "status": 500,
    "request": {
      "method": "POST",
      "url": "/api/external/users",
      "baseURL": "https://api.example.com"
    }
  },
  "requestId": "req_abc123",
  "action": "createUser",
  "userAgent": "Mozilla/5.0...",
  "msg": "Failed to create user"
}
```

### **2. Server Actions**

```typescript
// src/lib/actions/transferSolAction.ts
'use server'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import { getLogger } from '@/lib/logger/logger'
import type { ApiResponseBase } from '@/types'

interface TransferSolData {
  recipientAddress: string
  amount: number
  senderPublicKey: string
}

export async function transferSolAction(transferData: TransferSolData): Promise<ApiResponseBase<{ signature: string }>> {
  const logger = getLogger({
    context: 'server-action',
    action: 'transferSol',
    senderPublicKey: transferData.senderPublicKey,
  })

  try {
    logger.info('Starting SOL transfer', {
      recipientAddress: transferData.recipientAddress,
      amount: transferData.amount,
    })

    // Validation with domain-specific error codes
    if (!transferData.recipientAddress) {
      logger.warn('Missing recipient address', transferData)
      return {
        status: 'error',
        status_code: 400,
        error_message: 'Recipient address is required',
        error_code: SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS,
        data: null,
      }
    }

    if (transferData.amount <= 0) {
      logger.warn('Invalid transfer amount', { amount: transferData.amount })
      return {
        status: 'error',
        status_code: 400,
        error_message: 'Amount must be greater than 0',
        error_code: SOLANA_ERROR_CODES.INVALID_AMOUNT,
        data: null,
      }
    }

    // Check wallet balance
    logger.debug('Checking wallet balance', { wallet: transferData.senderPublicKey })
    const balance = await getWalletBalance(transferData.senderPublicKey)

    if (balance < transferData.amount) {
      logger.warn('Insufficient balance', {
        required: transferData.amount,
        available: balance,
      })
      return {
        status: 'error',
        status_code: 400,
        error_message: 'Insufficient SOL balance',
        error_code: SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS,
        data: null,
      }
    }

    // Solana transaction logic
    logger.info('Executing SOL transfer transaction')
    const signature = await performTransfer(transferData)

    logger.info('SOL transfer completed successfully', {
      signature,
      amount: transferData.amount,
    })

    return {
      status: 'success',
      status_code: 200,
      error_message: '',
      data: { signature },
    }
  } catch (error) {
    logger.error('SOL transfer failed', error, { transferData })

    // Parse Solana-specific errors
    if (error.message.includes('blockhash')) {
      logger.warn('Transaction blockhash expired', { error: error.message })
      return {
        status: 'error',
        status_code: 400,
        error_message: getUserErrorMessageFromError(error),
        error_code: SOLANA_ERROR_CODES.BLOCKHASH_EXPIRED,
        data: null,
      }
    }

    if (error.message.includes('simulation failed')) {
      logger.warn('Transaction simulation failed', { error: error.message })
      return {
        status: 'error',
        status_code: 400,
        error_message: getUserErrorMessageFromError(error),
        error_code: SOLANA_ERROR_CODES.SIMULATION_FAILED,
        data: null,
      }
    }

    return {
      status: 'error',
      status_code: 500,
      error_message: getUserErrorMessageFromError(error),
      error_code: SOLANA_ERROR_CODES.TRANSACTION_FAILED,
      data: null,
    }
  }
}
```

### **3. TanStack Query Hooks**

#### **Query Error Handling**

```typescript
// src/hooks/queries/useGetTokenBalanceQuery.ts
import { useQuery } from '@tanstack/react-query'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import { getLogger } from '@/lib/logger/logger'

export const useGetTokenBalanceQuery = ({ walletAddress, tokenMintAddress }: { walletAddress: string; tokenMintAddress: string }) => {
  const logger = getLogger({
    context: 'query',
    hook: 'useGetTokenBalanceQuery',
    walletAddress,
  })

  return useQuery({
    queryKey: ['token-balance', walletAddress, tokenMintAddress],
    queryFn: async () => {
      logger.info('Fetching token balance', {
        walletAddress,
        tokenMintAddress,
      })

      try {
        const response = await fetch(`/api/token-balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress, tokenMintAddress }),
        })

        const data = await response.json()

        if (!response.ok) {
          logger.warn('Token balance fetch failed', {
            status: response.status,
            error: data.error_message,
          })
          throw new Error(data.error_message || 'Failed to fetch token balance')
        }

        logger.info('Token balance fetched successfully', {
          balance: data.data?.balance,
        })

        return data.data
      } catch (error) {
        logger.error('Token balance query error', error, {
          walletAddress,
          tokenMintAddress,
        })
        throw new Error(getUserErrorMessageFromError(error, SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND))
      }
    },
    enabled: !!walletAddress && !!tokenMintAddress,
    retry: (failureCount, error) => {
      logger.debug('Query retry decision', {
        failureCount,
        errorMessage: error.message,
      })

      // Don't retry for wallet/validation errors
      if (error.message.includes('wallet') || error.message.includes('address')) {
        logger.info('Skipping retry for validation error')
        return false
      }
      // Retry network errors up to 3 times
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
```

#### **Mutation Error Handling**

```typescript
// src/hooks/mutations/useCreateTokenMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { handleApiResponse } from '@/lib/utils/handleApiResponse'
import { getLogger } from '@/lib/logger/logger'
import { toast } from 'sonner'

export const useCreateTokenMutation = () => {
  const queryClient = useQueryClient()
  const logger = getLogger({
    context: 'mutation',
    hook: 'useCreateTokenMutation',
  })

  return useMutation({
    mutationFn: async (tokenData: CreateTokenData) => {
      logger.info('Starting token creation', {
        tokenName: tokenData.name,
        symbol: tokenData.symbol,
      })

      const response = await createTokenAction(tokenData)
      const result = handleApiResponse(response) // Throws user-friendly error if needed

      logger.info('Token creation completed', {
        tokenAddress: result.tokenAddress,
      })

      return result
    },
    onSuccess: (data) => {
      logger.info('Token creation mutation successful', {
        tokenAddress: data.tokenAddress,
      })
      toast.success('Token created successfully!')
      queryClient.invalidateQueries({ queryKey: ['user-tokens'] })
    },
    onError: (error: Error) => {
      logger.error('Token creation mutation failed', error)

      // Error message is already user-friendly from handleApiResponse
      toast.error(error.message)

      // Optional: Handle specific error codes for conditional logic
      const errorMessage = error.message
      if (errorMessage.includes('authority')) {
        logger.info('Showing mint authority help dialog')
        // Show mint authority help dialog
        showMintAuthorityHelp()
      } else if (errorMessage.includes('insufficient')) {
        logger.info('Showing SOL top-up dialog')
        // Show SOL top-up options
        showTopUpDialog()
      }
    },
  })
}
```

### **4. TanStack Query Prefetch**

```typescript
// src/lib/queries/prefetchUserData.ts
import { QueryClient } from '@tanstack/react-query'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import { getLogger } from '@/lib/logger/logger'

export async function prefetchUserTokens(
  queryClient: QueryClient,
  walletAddress: string
) {
  const logger = getLogger({
    context: 'prefetch',
    function: 'prefetchUserTokens',
    walletAddress
  })

  try {
    logger.info('Starting user tokens prefetch')

    await queryClient.prefetchQuery({
      queryKey: ['user-tokens', walletAddress],
      queryFn: async () => {
        logger.debug('Executing prefetch query', { walletAddress })

        const response = await fetch(`/api/user-tokens/${walletAddress}`)
        const data = await response.json()

        if (!response.ok) {
          logger.warn('Prefetch query failed', {
            status: response.status,
            error: data.error_message
          })
          throw new Error(data.error_message || 'Failed to fetch user tokens')
        }

        logger.info('Prefetch query successful', {
          tokenCount: data.data?.length
        })

        return data.data
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })

    logger.info('User tokens prefetch completed successfully')
  } catch (error) {
    // Log prefetch errors but don't throw (graceful degradation)
    logger.error('Failed to prefetch user tokens', error, { walletAddress })
  }
}

// Usage in layout or page component
export default function UserDashboard({ walletAddress }: { walletAddress: string }) {
  const queryClient = useQueryClient()
  const logger = getLogger({
    context: 'component',
    component: 'UserDashboard'
  })

  useEffect(() => {
    if (walletAddress) {
      logger.info('Triggering user tokens prefetch', { walletAddress })
      prefetchUserTokens(queryClient, walletAddress)
    }
  }, [walletAddress, queryClient, logger])

  return <div>...</div>
}
```

### **5. Client Components with Error Handling**

```typescript
// src/components/TransferSolForm.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { transferSolAction } from '@/lib/actions/transferSolAction'
import { handleApiResponse } from '@/lib/utils/handleApiResponse'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { getLogger } from '@/lib/logger/logger'

export function TransferSolForm({ walletAddress }: { walletAddress: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientAddress: '',
    amount: 0
  })

  const logger = getLogger({
    context: 'component',
    component: 'TransferSolForm',
    walletAddress
  })

  const handleTransfer = async () => {
    setIsLoading(true)
    logger.info('Starting SOL transfer from form', formData)

    try {
      const response = await transferSolAction({
        ...formData,
        senderPublicKey: walletAddress
      })

      const result = handleApiResponse(response)

      logger.info('SOL transfer form submission successful', {
        signature: result.signature
      })

      toast.success(`Transfer successful! Transaction: ${result.signature}`)
      setFormData({ recipientAddress: '', amount: 0 })

    } catch (error) {
      logger.error('SOL transfer form submission failed', error, { formData })

      // Error message is already user-friendly
      toast.error(error.message)

      // Optional: Conditional UI logic based on original response
      if (response?.error_code === SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS) {
        logger.info('Showing top-up dialog for insufficient funds')
        // Show SOL purchase options
        setShowTopUpDialog(true)
      } else if (response?.error_code === SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS) {
        logger.info('Focusing address input for invalid address')
        // Focus the address input
        addressInputRef.current?.focus()
      }

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleTransfer}>
      {/* Form fields */}
    </form>
  )
}
```

## 🔍 Solana Error Handling with Status Codes

### **HTTP Status Code + Error Code Mapping**

| HTTP Status | Error Code               | User Message                             | Use Case           |
| ----------- | ------------------------ | ---------------------------------------- | ------------------ |
| `400`       | `WALLET_NOT_CONNECTED`   | "Please connect your wallet to continue" | Wallet validation  |
| `400`       | `INSUFFICIENT_FUNDS`     | "You don't have enough SOL"              | Balance check      |
| `400`       | `INVALID_WALLET_ADDRESS` | "Invalid wallet address"                 | Address validation |
| `400`       | `BLOCKHASH_EXPIRED`      | "Transaction expired. Please try again"  | Transaction timing |
| `400`       | `SIMULATION_FAILED`      | "Transaction preview failed"             | Pre-flight checks  |
| `429`       | `RPC_RATE_LIMITED`       | "Too many requests to Solana network"    | RPC throttling     |
| `500`       | `TRANSACTION_FAILED`     | "Transaction failed. Please try again"   | General tx errors  |
| `503`       | `RPC_CONNECTION_FAILED`  | "Unable to connect to Solana network"    | RPC connectivity   |

### **Advanced Solana Error Parsing**

For more sophisticated Solana error handling, you can implement inline error parsing in your server actions:

```typescript
// Example: Enhanced error parsing in server actions
export async function transferSolAction(data: TransferData) {
  const logger = getLogger({
    context: 'server-action',
    action: 'transferSolAction',
  })

  try {
    logger.info('Processing SOL transfer', {
      amount: data.amount,
      recipientAddress: data.recipientAddress,
    })

    // ... transaction logic
  } catch (error) {
    const errorMessage = error?.message || String(error)
    logger.error('SOL transfer action failed', error, { transferData: data })

    // Parse specific Solana errors inline
    if (errorMessage.includes('blockhash') && errorMessage.includes('expired')) {
      logger.warn('Blockhash expired during transfer', { errorMessage })
      return {
        status: 'error',
        status_code: 400,
        error_message: getUserErrorMessageFromError(error),
        error_code: SOLANA_ERROR_CODES.BLOCKHASH_EXPIRED,
        data: null,
      }
    }

    if (errorMessage.includes('Simulation failed')) {
      logger.warn('Transaction simulation failed', { errorMessage })
      return {
        status: 'error',
        status_code: 400,
        error_message: getUserErrorMessageFromError(error),
        error_code: SOLANA_ERROR_CODES.SIMULATION_FAILED,
        data: null,
      }
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      logger.warn('RPC rate limit encountered', { errorMessage })
      return {
        status: 'error',
        status_code: 429,
        error_message: getUserErrorMessageFromError(error),
        error_code: SOLANA_ERROR_CODES.RPC_RATE_LIMITED,
        data: null,
      }
    }

    // Default fallback
    logger.error('Unhandled transfer error', { errorMessage })
    return {
      status: 'error',
      status_code: 500,
      error_message: getUserErrorMessageFromError(error),
      error_code: SOLANA_ERROR_CODES.TRANSACTION_FAILED,
      data: null,
    }
  }
}
```

## 🎯 Best Practices

### **✅ Do's**

1. **Always use structured API responses** with `status`, `status_code`, `error_message`, and `error_code`
2. **Use specific error codes** instead of generic ones for better UX
3. **Trust `handleApiResponse`** to process responses and throw user-friendly errors
4. **Log detailed errors** while showing simplified messages to users
5. **Implement retry logic** for transient Solana network errors
6. **Use domain-specific error codes** for Solana operations
7. **Create contextual loggers** with relevant metadata for debugging
8. **Log at appropriate levels** (info, warn, error, debug) based on severity

### **❌ Don'ts**

1. **Don't create custom error messages** - use the centralized message system
2. **Don't expose technical details** like stack traces to users
3. **Don't retry wallet validation errors** - these need user action
4. **Don't use generic HTTP status messages** when specific error codes are available
5. **Don't use console.log/error** directly - always use the centralized logger
6. **Don't log sensitive data** like private keys or personal information

## 📊 Comprehensive Logging Integration

### **Logger Context Patterns**

The centralized logging system supports rich contextual information for effective debugging:

```typescript
// API Routes - Include route and method info
const logger = getLogger({
  context: 'api',
  route: '/api/tokens/create',
  method: 'POST',
  userId: session?.user?.id,
})

// Server Actions - Include action and user context
const logger = getLogger({
  context: 'server-action',
  action: 'createToken',
  walletAddress: userWallet,
})

// React Components - Include component and user context
const logger = getLogger({
  context: 'component',
  component: 'TokenCreator',
  page: 'tools',
  walletAddress,
})

// TanStack Query - Include query/mutation info
const logger = getLogger({
  context: 'query',
  hook: 'useGetTokenBalance',
  queryKey: ['token-balance', walletAddress],
})

// Services/Utilities - Include service and operation
const logger = getLogger({
  context: 'solana',
  service: 'transaction',
  operation: 'createToken',
})

// Error Boundaries - Include boundary and page context
const logger = getLogger({
  context: 'error-boundary',
  boundary: 'global',
  page: router.pathname,
})
```

### **Logging Best Practices by Level**

```typescript
// INFO: Successful operations, important state changes
logger.info('User successfully created token', {
  tokenAddress: '7xKXgRfk...',
  tokenName: 'MyToken',
  supply: 1000000,
})

// WARN: Recoverable errors, unusual but not critical situations
logger.warn('Rate limit approaching', {
  current: 8,
  limit: 10,
  endpoint: '/api/tokens',
})

// ERROR: Failures that need attention, user-impacting issues
logger.error('Token creation failed', error, {
  userWallet: 'ABC123...',
  tokenParams: sanitizedParams,
})

// DEBUG: Detailed flow information, debugging data
logger.debug('Processing token metadata', {
  metadata: tokenMetadata,
  step: 'validation',
})
```

### **Error + Logging Integration Example**

```typescript
// Complete error handling with logging in API route
export async function POST(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger({
    context: 'api',
    route: '/api/tokens/create',
    requestId: crypto.randomUUID(),
  })

  try {
    const body = await request.json()
    logger.info('Token creation request received', {
      tokenName: body.name,
      supply: body.supply,
    })

    // Validation with logging
    if (!body.walletAddress) {
      logger.warn('Missing wallet address in request', { body })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: getAppErrorMessage(SOLANA_ERROR_CODES.WALLET_NOT_CONNECTED),
          error_code: SOLANA_ERROR_CODES.WALLET_NOT_CONNECTED,
          data: null,
        },
        { status: 400 }
      )
    }

    // Business logic with progress logging
    logger.debug('Validating token parameters')
    const validatedParams = await validateTokenParams(body)

    logger.info('Creating token on Solana network')
    const result = await createTokenOnSolana(validatedParams)

    logger.info('Token creation successful', {
      tokenAddress: result.address,
      signature: result.signature,
    })

    return NextResponse.json({
      status: 'success',
      status_code: 201,
      error_message: '',
      data: result,
    })
  } catch (error) {
    // Error-specific logging with context
    if (error.message.includes('insufficient funds')) {
      logger.warn('User has insufficient SOL for token creation', {
        error: error.message,
        userWallet: body?.walletAddress,
      })
    } else if (error.message.includes('simulation failed')) {
      logger.error('Token creation simulation failed', error, {
        tokenParams: body,
      })
    } else {
      logger.error('Unexpected token creation error', error, {
        requestBody: body,
      })
    }

    return NextResponse.json(
      {
        status: 'error',
        status_code: getStatusCodeFromError(error),
        error_message: getUserErrorMessageFromError(error),
        error_code: getSolanaErrorCode(error),
        data: null,
      },
      { status: getStatusCodeFromError(error) }
    )
  }
}
```

### **Client-Side Logging Examples**

```typescript
// React Component with comprehensive logging
function TokenCreator() {
  const logger = getLogger({
    context: 'component',
    component: 'TokenCreator'
  })

  const createTokenMutation = useMutation({
    mutationFn: async (data: TokenData) => {
      logger.info('Token creation initiated', { tokenName: data.name })

      const response = await createTokenAction(data)
      const result = handleApiResponse(response)

      logger.info('Token creation completed', {
        tokenAddress: result.address
      })

      return result
    },
    onSuccess: (data) => {
      logger.info('Token creation mutation success', {
        tokenAddress: data.address
      })
      toast.success('Token created successfully!')
    },
    onError: (error) => {
      logger.error('Token creation mutation failed', error)
      toast.error(error.message)
    }
  })

  const handleSubmit = (formData: TokenData) => {
    logger.info('Form submission started', {
      tokenName: formData.name,
      supply: formData.supply
    })

    createTokenMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form implementation */}
    </form>
  )
}
```

### **Production Logging Considerations**

```typescript
// Environment-aware logging configuration
const logger = getLogger({
  context: 'api',
  route: '/api/sensitive-operation',
  // Only include sensitive data in development
  ...(process.env.NODE_ENV === 'development' && {
    userEmail: user.email,
  }),
})

// Conditional detailed logging
if (process.env.NODE_ENV === 'development') {
  logger.debug('Full request payload', { requestBody })
} else {
  logger.debug('Processing request', {
    requestSize: JSON.stringify(requestBody).length,
  })
}

// Production-safe error logging
logger.error('Operation failed', error, {
  // Include helpful context without sensitive data
  operationType: 'token-creation',
  userWalletHash: hashWalletAddress(userWallet),
  timestamp: new Date().toISOString(),
  // Exclude in production: full user data, private keys, etc.
})
```

### **🔧 Error Handling Checklist**

- [ ] Use `ApiResponseBase<T>` for all API responses
- [ ] Include appropriate `error_code` for conditional logic
- [ ] Process responses with `handleApiResponse` in client components
- [ ] Create contextual loggers with relevant metadata
- [ ] Log at appropriate levels (info, warn, error, debug)
- [ ] Implement retry logic for transient errors
- [ ] Show user-friendly toast notifications
- [ ] Handle wallet connection states properly
- [ ] Parse and categorize Solana-specific errors
- [ ] Never log sensitive data (private keys, personal info)
- [ ] Use structured logging for better debugging

## 🌟 Benefits

✅ **Consistent Experience** - Same error handling pattern across all layers  
✅ **User-Friendly Messages** - Clear, actionable error messages  
✅ **Developer-Friendly** - Detailed logging and specific error codes  
✅ **Type-Safe** - Full TypeScript support throughout  
✅ **Solana-Optimized** - Specialized handling for Web3 operations  
✅ **Scalable** - Easy to extend with new error types and domains  
✅ **Maintainable** - Centralized error message management  
✅ **Observable** - Comprehensive logging for debugging and monitoring  
✅ **Production-Ready** - Environment-aware logging with security considerations  
✅ **Contextual** - Rich metadata for effective troubleshooting

This comprehensive error handling strategy with integrated logging ensures your Solana Web3 application provides excellent user experience while maintaining robust error tracking, debugging capabilities, and operational visibility! 🚀
