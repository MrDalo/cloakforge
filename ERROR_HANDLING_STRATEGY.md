# 🚀 Error Handling Strategy for Solana Web3 Application

## 📋 Overview

This comprehensive error handling strategy provides robust error management across all layers of your Next.js Solana Web3 application. The system implements a **two-tier error code architecture** that handles both generic application errors and domain-specific Solana/crypto errors with user-friendly messages and detailed logging.

## 🏗️ Architecture Overview

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
5. **API Response Handler** (`src/lib/utils/handleApiResponse.ts`) - Standardized API response processing

## 🔧 Error Type System

### **Base Types** (`src/types/error.ts`)

```typescript
export interface ApiResponseBase<T> {
	status_code: number
	status: 'success' | 'error'
	error_message: string
	error_code?: string // Optional application-specific error code
	data: T
}

export class HTTPError extends Error {
	status: number
	constructor(message: string, status: number) {
		super(message)
		this.name = 'HTTPError'
		this.status = status
	}
}
```

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
```

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

## 💡 Usage Patterns by Layer

### **1. API Route Handlers**

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { getAppErrorMessage } from '@/lib/utils/getAppErrorMessage'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'

export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		const body = await request.json()

		// Validation with specific error codes
		if (!body.email) {
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

		return NextResponse.json({
			status: 'success',
			status_code: 201,
			error_message: '',
			data: user,
		})
	} catch (error) {
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

### **2. Server Actions**

```typescript
// src/lib/actions/transferSolAction.ts
'use server'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import type { ApiResponseBase } from '@/types/error'

interface TransferSolData {
	recipientAddress: string
	amount: number
	senderPublicKey: string
}

export async function transferSolAction(transferData: TransferSolData): Promise<ApiResponseBase<{ signature: string }>> {
	try {
		// Validation with domain-specific error codes
		if (!transferData.recipientAddress) {
			return {
				status: 'error',
				status_code: 400,
				error_message: 'Recipient address is required',
				error_code: SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS,
				data: null,
			}
		}

		if (transferData.amount <= 0) {
			return {
				status: 'error',
				status_code: 400,
				error_message: 'Amount must be greater than 0',
				error_code: SOLANA_ERROR_CODES.INVALID_AMOUNT,
				data: null,
			}
		}

		// Check wallet balance
		const balance = await getWalletBalance(transferData.senderPublicKey)
		if (balance < transferData.amount) {
			return {
				status: 'error',
				status_code: 400,
				error_message: 'Insufficient SOL balance',
				error_code: SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS,
				data: null,
			}
		}

		// Solana transaction logic
		const signature = await performTransfer(transferData)

		return {
			status: 'success',
			status_code: 200,
			error_message: '',
			data: { signature },
		}
	} catch (error) {
		// Parse Solana-specific errors
		if (error.message.includes('blockhash')) {
			return {
				status: 'error',
				status_code: 400,
				error_message: getUserErrorMessageFromError(error),
				error_code: SOLANA_ERROR_CODES.BLOCKHASH_EXPIRED,
				data: null,
			}
		}

		if (error.message.includes('simulation failed')) {
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

export const useGetTokenBalanceQuery = ({ walletAddress, tokenMintAddress }: { walletAddress: string; tokenMintAddress: string }) => {
	return useQuery({
		queryKey: ['token-balance', walletAddress, tokenMintAddress],
		queryFn: async () => {
			try {
				const response = await fetch(`/api/token-balance`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ walletAddress, tokenMintAddress }),
				})

				const data = await response.json()

				if (!response.ok) {
					throw new Error(data.error_message || 'Failed to fetch token balance')
				}

				return data.data
			} catch (error) {
				throw new Error(getUserErrorMessageFromError(error, SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND))
			}
		},
		enabled: !!walletAddress && !!tokenMintAddress,
		retry: (failureCount, error) => {
			// Don't retry for wallet/validation errors
			if (error.message.includes('wallet') || error.message.includes('address')) {
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
import { toast } from 'sonner'

export const useCreateTokenMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (tokenData: CreateTokenData) => {
			const response = await createTokenAction(tokenData)
			return handleApiResponse(response) // Throws user-friendly error if needed
		},
		onSuccess: (data) => {
			toast.success('Token created successfully!')
			queryClient.invalidateQueries({ queryKey: ['user-tokens'] })
		},
		onError: (error: Error) => {
			// Error message is already user-friendly from handleApiResponse
			toast.error(error.message)

			// Optional: Handle specific error codes for conditional logic
			const errorMessage = error.message
			if (errorMessage.includes('authority')) {
				// Show mint authority help dialog
				showMintAuthorityHelp()
			} else if (errorMessage.includes('insufficient')) {
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

export async function prefetchUserTokens(
  queryClient: QueryClient,
  walletAddress: string
) {
  try {
    await queryClient.prefetchQuery({
      queryKey: ['user-tokens', walletAddress],
      queryFn: async () => {
        const response = await fetch(`/api/user-tokens/${walletAddress}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error_message || 'Failed to fetch user tokens')
        }

        return data.data
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  } catch (error) {
    // Log prefetch errors but don't throw (graceful degradation)
    console.error('Failed to prefetch user tokens:', getUserErrorMessageFromError(error, SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND))
  }
}

// Usage in layout or page component
export default function UserDashboard({ walletAddress }: { walletAddress: string }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (walletAddress) {
      prefetchUserTokens(queryClient, walletAddress)
    }
  }, [walletAddress, queryClient])

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

export function TransferSolForm({ walletAddress }: { walletAddress: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientAddress: '',
    amount: 0
  })

  const handleTransfer = async () => {
    setIsLoading(true)

    try {
      const response = await transferSolAction({
        ...formData,
        senderPublicKey: walletAddress
      })

      const result = handleApiResponse(response)

      toast.success(`Transfer successful! Transaction: ${result.signature}`)
      setFormData({ recipientAddress: '', amount: 0 })

    } catch (error) {
      // Error message is already user-friendly
      toast.error(error.message)

      // Optional: Conditional UI logic based on original response
      if (response?.error_code === SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS) {
        // Show SOL purchase options
        setShowTopUpDialog(true)
      } else if (response?.error_code === SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS) {
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
	try {
		// ... transaction logic
	} catch (error) {
		const errorMessage = error?.message || String(error)

		// Parse specific Solana errors inline
		if (errorMessage.includes('blockhash') && errorMessage.includes('expired')) {
			return {
				status: 'error',
				status_code: 400,
				error_message: getUserErrorMessageFromError(error),
				error_code: SOLANA_ERROR_CODES.BLOCKHASH_EXPIRED,
				data: null,
			}
		}

		if (errorMessage.includes('Simulation failed')) {
			return {
				status: 'error',
				status_code: 400,
				error_message: getUserErrorMessageFromError(error),
				error_code: SOLANA_ERROR_CODES.SIMULATION_FAILED,
				data: null,
			}
		}

		if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
			return {
				status: 'error',
				status_code: 429,
				error_message: getUserErrorMessageFromError(error),
				error_code: SOLANA_ERROR_CODES.RPC_RATE_LIMITED,
				data: null,
			}
		}

		// Default fallback
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

### **❌ Don'ts**

1. **Don't create custom error messages** - use the centralized message system
2. **Don't expose technical details** like stack traces to users
3. **Don't retry wallet validation errors** - these need user action
4. **Don't use generic HTTP status messages** when specific error codes are available

### **🔧 Error Handling Checklist**

- [ ] Use `ApiResponseBase<T>` for all API responses
- [ ] Include appropriate `error_code` for conditional logic
- [ ] Process responses with `handleApiResponse` in client components
- [ ] Log errors with context for debugging
- [ ] Implement retry logic for transient errors
- [ ] Show user-friendly toast notifications
- [ ] Handle wallet connection states properly
- [ ] Parse and categorize Solana-specific errors

## 🌟 Benefits

✅ **Consistent Experience** - Same error handling pattern across all layers  
✅ **User-Friendly Messages** - Clear, actionable error messages  
✅ **Developer-Friendly** - Detailed logging and specific error codes  
✅ **Type-Safe** - Full TypeScript support throughout  
✅ **Solana-Optimized** - Specialized handling for Web3 operations  
✅ **Scalable** - Easy to extend with new error types and domains  
✅ **Maintainable** - Centralized error message management

This comprehensive error handling strategy ensures your Solana Web3 application provides excellent user experience while maintaining robust error tracking and debugging capabilities! 🚀
