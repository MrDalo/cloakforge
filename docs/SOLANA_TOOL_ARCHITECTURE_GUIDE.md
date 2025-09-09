# Solana Tool Architecture Guide - API Routes Only

## Overview

This guide outlines the **simplified hybrid architecture** pattern for building Solana tools in the SolCloak application. The Token Creator service serves as the definitive reference implementation, using **API Routes Only** for clean, maintainable architecture.

**Updated**: September 2025 - Simplified to API Routes Only approach (no server actions)

---

## 🎯 **SIMPLIFIED HYBRID ARCHITECTURE**

The hybrid architecture uses **only API routes** for server-side processing:

- ✅ **Client-Side**: Fast balance validation, transaction signing, transaction submission
- ✅ **Server-Side**: Transaction preparation, comprehensive validation, fee calculation
- ✅ **API Routes Only**: No server actions needed - direct API calls
- ✅ **Performance**: Private RPC for server, public RPC for client operations

### **Simplified Workflow Pattern**

```
Client Form → Hook → Client Balance Validation → API Route →
Server Utility → API Route Response → Hook → Client Signing → Client Submission
```

**Key Benefits of API Routes Only:**

- ✅ **No Duplication**: Single endpoint per operation
- ✅ **Standard REST**: Familiar patterns for all developers
- ✅ **Better Debugging**: Clear HTTP request/response flow
- ✅ **External Integration Ready**: Can be used outside Next.js app
- ✅ **Type Safety**: Full TypeScript support with `apiClient`
- ✅ **Simpler Architecture**: Eliminates server action complexity

## 🚫 **ELIMINATED: Server Actions Layer**

**Why We Don't Use Server Actions:**

- ❌ Creates unnecessary duplication with API routes
- ❌ Less flexible for external integrations
- ❌ Harder to debug (no clear HTTP flow)
- ❌ Next.js specific (limits reusability)
- ❌ Additional complexity without significant benefits

**Result**: Cleaner, simpler architecture with all hybrid benefits maintained.

## Architecture Layers

### 1. Form Layer (`components/pages/{ToolName}Page/{ToolName}Form/`)

**Responsibilities:**

- Client-side form validation using React Hook Form + Zod
- User input collection and validation
- Real-time feedback for validation errors

**Files:**

- `{toolName}FormSchema.ts` - Zod schema for form validation
- `{ToolName}Form.tsx` - React component with form logic
- `FormSections.tsx` - Form field components

**Example (Burn Tokens):**

```typescript
// burnTokensFormSchema.ts
import { SOLANA_ADDRESS_REGEX, solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const burnTokensFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Token address is required').regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana token address'),
  burnAmount: z.number().min(0.000001, 'Burn amount must be greater than 0'),
  confirmed: z.boolean().refine((val) => val === true, 'You must confirm this action'),
  tokenInfo: z
    .object({
      // Token metadata fields
    })
    .optional(),
})
```

**Key Patterns:**

- Use shared validation regex and schemas
- Include confirmation checkboxes for destructive operations
- Optional token metadata for enhanced UX

### 2. Page Layer (`app/tools/{tool-name}/page.tsx`)

**Responsibilities:**

- Form submission handling
- Data transformation from form format to API format
- Integration with custom hooks
- Error handling coordination

**Example:**

```typescript
const handleSubmit = async (data: FormData): Promise<void> => {
  const logger = getLogger({ context: 'tool-name', page: 'tools' })

  try {
    // Transform form data to API parameters
    const apiParams = {
      walletAddress: context.walletAddress, // Added by hook
      param1: data.field1,
      param2: data.field2,
      // ... other fields
    }

    const result = await useToolHook(apiParams)
    if (result) {
      logger.info('Operation completed successfully', { signature: result.signature })
    }
  } catch (error) {
    logger.error('Error in handler:', error)
    // Error handling is done in the hook
  }
}
```

**Key Patterns:**

- Transform form data to match API expectations
- Use structured logging with context
- Let hooks handle error display (avoid duplicate error handling)

### **4. Hook Layer** (`hooks/solana/use{ToolName}.ts`) **[SIMPLIFIED HYBRID]**

**Responsibilities:**

- Orchestrates simplified hybrid workflow
- Client-side balance validation (fast pre-check)
- **Direct API route calls** (no server actions)
- Transaction signing and submission
- User feedback and error handling

**Simplified Architecture Pattern:**

```typescript
export function useTokenCreator() {
  const { connection } = useConnection() // PUBLIC RPC for client operations

  const executeTokenCreation = useCallback(
    async (context, params) => {
      try {
        // STEP 1: Client-side balance validation (FAST)
        const balanceValidation = await validateBalance({
          walletPublicKey: new PublicKey(context.walletAddress),
          connection, // PUBLIC RPC
          serviceId: 'token-creator',
          formData: params.tokenData,
          serviceFee: config?.baseFee ?? 0.02,
          networkFee: config?.networkFee ?? 0.0005,
        })

        if (!balanceValidation.hasSufficientBalance) {
          throw new SolanaError('Insufficient funds', SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
        }

        // STEP 2: Direct API route call (NO SERVER ACTIONS)
        const response = await apiClient<TokenCreatorRequest, UnsignedTokenCreationResponse>('/api/solana/token-creator', requestBody)

        // STEP 3: Client-side transaction signing
        const transaction = Transaction.from(Buffer.from(response.serializedTransaction, 'base64'))
        const signedTransaction = await context.signTransaction(transaction)

        // STEP 4: Client-side transaction submission
        const signature = await connection.sendRawTransaction(signedTransaction.serialize())

        // STEP 5: Transaction confirmation and user feedback
        const confirmation = await connection.confirmTransaction(signature, 'confirmed')
        showTransactionToast({ signature, type: 'token-creation' })

        return { ...response, signature, confirmed: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },
    [connection, config]
  )

  const toolBase = useToolBase({ toolId: 'token-creator', requiresWallet: true }, executeTokenCreation)
  return { createToken: toolBase.execute, ...toolBase }
}
```

### **5. API Route Layer** (`app/api/solana/{tool-name}/route.ts`) **[SINGLE SOURCE OF TRUTH]**

**Responsibilities:**

- Server-side request validation using Zod schemas
- Security validation (origin checking)
- Business logic validation using private RPC
- Unsigned transaction preparation
- Comprehensive error responses

**Structure:**

```typescript
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponseBase<ResponseType>>> {
  try {
    // 1. Security validation
    await validateSecurity(request, { skipForLocalhost: true })

    // 2. Request parsing and validation
    const body = await request.json()
    const validation = validateRequestBody(body, toolRequestSchema)
    if (!validation.success) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: `Validation failed: ${validation.errors}`,
          error_code: APP_ERROR_CODES.INVALID_INPUT,
          data: null,
        },
        { status: 400 }
      )
    }
    const validatedData = validation.data

    // 3. Address validation (Solana PublicKey validation)
    const addresses = validateSolanaAddresses(validatedData)

    // 4. Business logic validation using PRIVATE RPC
    const serverConfig = getServerConfig()
    const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')

    // 5. Call utility function
    const result = await toolUtilityFunction(validatedData, connection)

    // 6. Return unsigned transaction
    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: result,
    })
  } catch (error) {
    // Comprehensive error handling
  }
}
```

**Key Patterns:**

- Always validate security first
- Use shared validation schemas
- Use private RPC for server-side operations
- Validate addresses with both Zod and Solana's PublicKey
- Return unsigned transactions for client-side signing
- Comprehensive error handling with specific error codes

### **6. Server Utility Layer** (`lib/solana/{tool}.ts`) **[SERVER-ONLY]**

**Responsibilities:**

- Pure server-side business logic with 'server-only' directive
- Transaction construction using PRIVATE RPC
- Comprehensive validation and fee calculation
- Service fee collection and memo integration
- Returns unsigned transactions for client-side signing

**Implementation Pattern:**

```typescript
import 'server-only'

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getServerConfig } from '@/lib/config/getServerConfig'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'
import { addServiceMemo, SERVICE_IDENTIFIERS } from '@/lib/solana/serviceMemo'

export async function createTokenTransaction({
  walletAddress,
  tokenData,
}: CreateTokenParams): Promise<CreateTokenResult> {
  // PRIVATE RPC connection for server-side operations
  const serverConfig = getServerConfig()
  const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')

  const walletPublicKey = new PublicKey(walletAddress)

  // Service fee calculation
  let totalServiceFeeSOL = toolConfig?.baseFee ?? 0.02
  const toolFees = toolFeeConfigs['token-creator']()
  for (const feeConfig of toolFees) {
    if (feeConfig.condition && tokenData[feeConfig.fieldName]) {
      totalServiceFeeSOL += feeConfig.fee
    }
  }

  // Enhanced balance validation using private RPC
  const walletBalance = await connection.getBalance(walletPublicKey)
  const totalRequiredLamports = /* calculate total cost */

  if (walletBalance < totalRequiredLamports) {
    throw new SolanaError('Insufficient funds', SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
  }

  // Transaction construction
  const transaction = new Transaction()

  // Service fee transfer
  if (totalServiceFeeSOL > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: new PublicKey(serverConfig.feeWalletAddress),
        lamports: Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL),
      })
    )

    // Service memo for on-chain tracking
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_CREATOR, `fee:${totalServiceFeeSOL}SOL`)
  }

  // Tool-specific instructions
  // ... add tool-specific transaction instructions

  // Return unsigned transaction
  return {
    success: true,
    transaction: Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64'),
    mintAddress: mintKeypair.publicKey.toString(),
    totalServiceFee: totalServiceFeeSOL,
    estimatedNetworkFee: estimatedNetworkFee / LAMPORTS_PER_SOL,
  }
}
```

---

## 🛠️ **IMPLEMENTATION CHECKLIST FOR NEW TOOLS**

When creating a new tool using the **API Routes Only** approach:

### **Required Files:**

- [ ] Form schema: `components/pages/{ToolName}Page/{ToolName}Form/schema.ts`
- [ ] Form component: `components/pages/{ToolName}Page/{ToolName}Form/index.tsx`
- [ ] Page component: `app/tools/{tool-name}/page.tsx`
- [ ] Hook: `hooks/solana/use{ToolName}.ts` (uses API routes only)
- [ ] API route: `app/api/solana/{tool-name}/route.ts`
- [ ] Server utility: `lib/solana/create{ToolName}Transaction.ts` (server-only)
- [ ] Balance validation: `lib/solana/validateBalance.ts` (reusable)
- [ ] Types: `types/{toolName}.ts`

### **Architecture Compliance:**

- [ ] Client-side balance validation before API calls
- [ ] Direct API route calls (no server actions)
- [ ] Server-only directive in utilities
- [ ] Private RPC for server operations
- [ ] Public RPC for client operations
- [ ] Service fee collection and memo integration
- [ ] Comprehensive error handling
- [ ] Type-safe API communication with `apiClient`
- [ ] User feedback with toasts and loading states

### **Benefits Achieved:**

- ✅ **Simplified Architecture**: No server action duplication
- ✅ **Better Performance**: Client-side balance validation prevents unnecessary API calls
- ✅ **Type Safety**: End-to-end TypeScript with `apiClient`
- ✅ **Standard Patterns**: Familiar REST API approach
- ✅ **External Ready**: API routes can be used outside Next.js app
- ✅ **Easy Debugging**: Clear HTTP request/response flow

---

## 📋 **MIGRATION GUIDE: Server Actions → API Routes Only**

If you have existing tools using server actions, follow this migration pattern:

### **Before (Server Actions):**

```typescript
// Hook calling server action
const serverResult = await createTokenAction(data)

// Server action file
;('use server')
export async function createTokenAction(params) {
  return await createToken(params)
}
```

### **After (API Routes Only):**

```typescript
// Hook calling API route directly
const response = await apiClient<TokenCreatorRequest, UnsignedTokenCreationResponse>('/api/solana/token-creator', requestBody)

// No server action file needed - removed entirely
```

### **Migration Steps:**

1. Remove server action file (`lib/actions/{tool}Action.ts`)
2. Update hook to call API route directly using `apiClient`
3. Ensure API route has comprehensive validation
4. Test to ensure all functionality remains intact
5. Update documentation to reflect simplified architecture

This approach eliminates complexity while maintaining all benefits of the hybrid architecture.

## Shared Components

### 1. Schema Definitions (`lib/schemas/apiSchemas.ts`)

```typescript
export const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
export const solanaAddressSchema = z.string().min(1).regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana address')

export const toolRequestSchema = z.object({
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  // ... other fields with proper validation
})
```

### 2. Type Definitions (`types/api.ts`)

```typescript
export interface ToolRequest {
  walletAddress: string
  // ... other fields
}

export interface UnsignedToolResponse {
  serializedTransaction: string
  // ... other response data
}
```

### 3. Validation Utilities (`lib/utils/validateRequestBody.ts`)

```typescript
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string }
```

### 4. API Client (`lib/utils/apiClient.ts`)

```typescript
export async function apiClient<TRequest, TResponse>(endpoint: string, request: TRequest): Promise<TResponse>
```

## RPC Endpoint Usage

### Public RPC (Client-Side)

- **Source**: Wallet adapter's connection (`useConnection()`)
- **Usage**: Transaction submission, wallet balance checks for UI
- **Location**: Client-side hooks

### Private RPC (Server-Side)

- **Source**: `getServerConfig().rpcPrivateEndpoint`
- **Usage**: Transaction preparation, validation, balance checks
- **Location**: API routes and utility functions
- **Benefits**: Faster, more reliable, no rate limits

## Error Handling Strategy

### Error Codes

- Use specific error codes from `SOLANA_ERROR_CODES` and `APP_ERROR_CODES`
- Map error codes to user-friendly messages in hooks
- Log detailed errors server-side, show simple messages client-side

### Error Propagation

1. **Utility Layer**: Throws `SolanaError` with specific codes
2. **API Route**: Catches and returns structured error responses
3. **Hook Layer**: Catches API errors, maps to user messages, shows toasts
4. **Form Layer**: Displays validation errors inline

### User Feedback

- Loading states during operations
- Success toasts with transaction signatures
- Error toasts with actionable messages
- Inline validation errors

## Security Considerations

1. **Origin Validation**: All API routes validate request origin
2. **Ownership Validation**: Server validates user owns token accounts
3. **Balance Validation**: Client-side pre-validation using public RPC for performance
4. **Private RPC**: Sensitive operations use private RPC endpoints
5. **Transaction Signing**: All transactions signed client-side, never server-side

## Implementation Checklist

When creating a new tool, ensure:

- [ ] Shared Zod schema in `/lib/schemas/apiSchemas.ts`
- [ ] Form schema using shared validation patterns
- [ ] Page component with proper data transformation
- [ ] Hook using `useToolBase` pattern with type-safe API calls
- [ ] Client-side balance validation utility (for tools with transaction costs)
- [ ] Client-side balance validation in hook before API calls
- [ ] API route with comprehensive validation and error handling
- [ ] Utility function with pure business logic
- [ ] Proper RPC endpoint usage (public for client, private for server)
- [ ] Type definitions in `/types/api.ts`
- [ ] Error handling with specific codes and user-friendly messages
- [ ] Security validation in API routes
- [ ] Comprehensive logging with structured data
- [ ] Toast notifications for user feedback
- [ ] Transaction preparation server-side, signing client-side

## Benefits of This Architecture

1. **Type Safety**: End-to-end TypeScript ensures correctness
2. **Validation Consistency**: Shared schemas prevent client/server discrepancies
3. **Security**: Multiple validation layers and proper RPC usage
4. **Performance**: Private RPC for server operations prevents rate limiting
5. **User Experience**: Proper error handling and feedback
6. **Maintainability**: Clear separation of concerns and reusable patterns
7. **Scalability**: Standardized patterns make adding new tools straightforward

## Example Implementation Files

Use the Burn Token implementation as a reference:

- Form: `src/components/pages/BurnTokensPage/BurnForm/`
- Page: `src/app/tools/burn-tokens/page.tsx`
- Hook: `src/hooks/solana/useBurnTokens.ts`
- API: `src/app/api/solana/burn-tokens/route.ts`
- Utility: `src/lib/solana/burnToken.ts`
- Schema: `src/lib/schemas/apiSchemas.ts` (burnTokensRequestSchema)
- Types: `src/types/api.ts` (BurnTokensRequest, UnsignedBurnTransactionResponse)

This architecture ensures all Solana tools follow consistent, secure, and maintainable patterns while providing excellent user experience and developer productivity.
