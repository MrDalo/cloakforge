# Solana Tool Architecture Guide - API Routes Only + Comprehensive Error Handling

## Overview

This guide outlines the **simplified hybrid architecture** pattern with **comprehensive error handling strategy** for building Solana tools in the CloakForge application. The Token Creator service serves as the definitive reference implementation, using **API Routes Only** for clean, maintainable architecture with robust error handling.

**Updated**: September 2025 - Includes comprehensive error handling strategy from Token Creator implementation

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
import { useToolConfig } from '@/stores/toolConfigStore'

export function useTokenCreator() {
  const { connection } = useConnection() // PUBLIC RPC for client operations
  const { config } = useToolConfig('token-creator') // Get tool configuration from Contentful

  const executeTokenCreation = useCallback(
    async (context, params) => {
      try {
        // STEP 1: Client-side balance validation using tool config (FAST)
        const balanceValidation = await validateBalance({
          walletPublicKey: new PublicKey(context.walletAddress),
          connection, // PUBLIC RPC
          serviceId: 'token-creator',
          formData: params.tokenData,
          serviceFee: config?.baseFee ?? 0.02, // Use tool config for service fee
          networkFee: config?.networkFee ?? 0.0005, // Use tool config for network fee
        })

        if (!balanceValidation.hasSufficientBalance) {
          const errorMessage = `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL (including ${config?.baseFee?.toFixed(4) ?? '0.0200'} SOL service fee), but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
          throw new SolanaError(errorMessage, SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
        }

        // STEP 2: Direct API route call (NO SERVER ACTIONS)
        const response = await apiClient<TokenCreatorRequest, UnsignedTokenCreationResponse>('/api/solana/token-creator', requestBody)

        // STEP 3: Client-side transaction signing
        const transaction = Transaction.from(Buffer.from(response.serializedTransaction, 'base64'))
        const signedTransaction = await context.signTransaction(transaction)

        // STEP 4: Client-side transaction submission
        const signature = await connection.sendRawTransaction(signedTransaction.serialize())

        // STEP 5: Ultra-fast parallel transaction confirmation strategy
        const { kitRpc } = createConnectionPair()
        const priorityFeeMicroLamports = 50000 // Default reasonable priority fee

        const confirmationResult = await confirmTransactionWithParallelStrategy(
          signature,
          priorityFeeMicroLamports,
          kitRpc,
          connection,
          logger
        )

        if (!confirmationResult.confirmed) {
          // Handle confirmation timeout with fallback check
          const finalCheck = await connection.getSignatureStatus(signature, { searchTransactionHistory: true })
          if (finalCheck?.value?.confirmationStatus === 'confirmed' || finalCheck?.value?.confirmationStatus === 'finalized') {
            // Transaction confirmed successfully
          } else if (finalCheck?.value?.err) {
            throw new Error(`Transaction failed: ${String(finalCheck?.value?.err)}`)
          } else {
            throw new SolanaError(
              'Transaction confirmation timed out - it may still be processing. Check the signature on Solana Explorer.',
              SOLANA_ERROR_CODES.FINALIZATION_TIMEOUT
            )
          }
        }

        // STEP 6: User feedback
        showTransactionToast({ signature, type: 'token-creation' })

        return { ...response, signature, confirmed: true }
      } catch (error) {
        // Error handling via useToolBase - provides consistent error processing
        throw error
      }
    },
    [connection, config?.baseFee, config?.networkFee] // Include config dependencies
  )

  const toolBase = useToolBase({ toolId: 'token-creator', requiresWallet: true }, executeTokenCreation)
  return { createToken: toolBase.execute, ...toolBase }
}
```

**Key Requirements:**

- ✅ **Tool Config Integration**: Use `useToolConfig(toolId)` to get dynamic service and network fees from Contentful
- ✅ **Config-Based Balance Validation**: Pass tool config fees to `validateBalance()` for accurate pre-validation
- ✅ **Dependency Management**: Include `config?.baseFee` and `config?.networkFee` in useCallback dependency array
- ✅ **Enhanced Error Messages**: Provide detailed error messages including service fee amounts from tool config
- ✅ **Fallback Values**: Use reasonable defaults when tool config is not available

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

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getServerConfig } from '@/lib/config/getServerConfig'
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from './serviceMemo'

export async function createTokenTransaction({ walletAddress, tokenData }: CreateTokenParams): Promise<CreateTokenResult> {
  // PRIVATE RPC connection for server-side operations
  const serverConfig = getServerConfig()
  const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')

  const walletPublicKey = new PublicKey(walletAddress)

  // **REQUIRED: Service fee calculation using tool config**
  let totalServiceFeeSOL = 0

  // Get base service fee from tool configuration
  try {
    const toolConfig = await getToolConfigFromCache('token-creator') // Use actual tool ID
    if (toolConfig?.baseFee) {
      totalServiceFeeSOL = toolConfig.baseFee
    }
  } catch (error) {
    logger.warn('Failed to get tool config for base fee, using zero', { error: String(error) })
  }

  // Enhanced balance validation including service fees using private RPC
  const walletBalance = await connection.getBalance(walletPublicKey)
  const estimatedCostSOL = 0.0001 + totalServiceFeeSOL // Network fee + service fee

  if (walletBalance < estimatedCostSOL * LAMPORTS_PER_SOL) {
    throw new SolanaError(
      `Insufficient SOL balance. Required: ${estimatedCostSOL.toFixed(4)} SOL (including ${totalServiceFeeSOL.toFixed(4)} SOL service fee), Available: ${(walletBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`,
      SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
    )
  }

  // **REQUIRED: Transaction construction with service fee and memo**
  const transaction = new Transaction()

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed')
  transaction.recentBlockhash = blockhash
  transaction.feePayer = walletPublicKey

  // **INSTRUCTION 1: Service memo for tracking (ALWAYS FIRST)**
  transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_CREATOR)) // Use appropriate service identifier

  // **INSTRUCTION 2: Service fee transfer (if applicable)**
  if (totalServiceFeeSOL > 0) {
    const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
    const serviceFeeAmount = Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL)

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: serviceFeeWallet,
        lamports: serviceFeeAmount,
      })
    )
  }

  // **INSTRUCTION 3+: Tool-specific instructions**
  // Add your tool-specific transaction instructions here
  // Example: token mint, burn, transfer, etc.

  // Return unsigned transaction for client-side signing
  return {
    transaction,
    totalServiceFee: totalServiceFeeSOL,
    estimatedNetworkFee: 0.0001,
    // ... other tool-specific response data
  }
}
```

**🔑 KEY REQUIREMENTS for ALL Tools:**

1. **⭐ Tool Config Integration**: Always use `getToolConfigFromCache(toolId)` to get dynamic service fees
2. **⭐ Service Fee Transfer**: Include service fee transfer instruction when `totalServiceFeeSOL > 0`
3. **⭐ Service Memo**: ALWAYS include `createServiceMemoInstruction(SERVICE_IDENTIFIERS.{TOOL})` as first instruction
4. **⭐ Balance Validation**: Include service fees in SOL balance validation with detailed error messages
5. **⭐ Instruction Ordering**:
   - First: Service memo instruction
   - Second: Service fee transfer (if applicable)
   - Third+: Tool-specific instructions
6. **⭐ Error Handling**: Use specific `SolanaError` codes with user-friendly messages including fee breakdowns

---

## 🛠️ **IMPLEMENTATION CHECKLIST FOR NEW TOOLS**

When creating a new tool using the **API Routes Only** approach with **comprehensive error handling**:

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

- [ ] Client-side balance validation before API calls using tool config
- [ ] Direct API route calls (no server actions)
- [ ] Server-only directive in utilities
- [ ] Private RPC for server operations
- [ ] Public RPC for client operations
- [ ] **⭐ Service fee collection using `getToolConfigFromCache(toolId)`**
- [ ] **⭐ Service memo integration with `createServiceMemoInstruction(SERVICE_IDENTIFIERS.{TOOL})`**
- [ ] **⭐ Tool config integration in hooks with `useToolConfig(toolId)`**
- [ ] Type-safe API communication with `apiClient`
- [ ] User feedback with toasts and loading states

### **⭐ NEW REQUIREMENTS - Service Fee & Memo Integration:**

#### **Hook Layer Requirements:**

- [ ] Import and use `useToolConfig(toolId)` to get dynamic service fees from Contentful
- [ ] Pass `config?.baseFee` and `config?.networkFee` to `validateBalance()`
- [ ] Include config dependencies in useCallback dependency array: `[connection, config?.baseFee, config?.networkFee]`
- [ ] Provide detailed error messages with service fee breakdown in insufficient funds errors

#### **Server Utility Requirements:**

- [ ] Import required modules: `SystemProgram`, `LAMPORTS_PER_SOL`, `getToolConfigFromCache`, `createServiceMemoInstruction`, `SERVICE_IDENTIFIERS`
- [ ] Use `getToolConfigFromCache(toolId)` to get dynamic service fees (with fallback error handling)
- [ ] Include service fee in SOL balance validation with detailed error messages
- [ ] **INSTRUCTION 1**: Add service memo instruction FIRST: `createServiceMemoInstruction(SERVICE_IDENTIFIERS.{TOOL})`
- [ ] **INSTRUCTION 2**: Add service fee transfer if `totalServiceFeeSOL > 0`
- [ ] **INSTRUCTION 3+**: Add tool-specific instructions
- [ ] Use correct service identifier for each tool (e.g., `TOKEN_CREATOR`, `TOKEN_BURNER`, etc.)

#### **Service Identifier Mapping:**

- [ ] Token Creator: `SERVICE_IDENTIFIERS.TOKEN_CREATOR`
- [ ] Burn Tokens: `SERVICE_IDENTIFIERS.TOKEN_BURNER`
- [ ] Freeze Accounts: `SERVICE_IDENTIFIERS.FREEZE_ACCOUNTS`
- [ ] Unfreeze Accounts: `SERVICE_IDENTIFIERS.UNFREEZE_ACCOUNTS`
- [ ] Revoke Authority: `SERVICE_IDENTIFIERS.AUTHORITY_MANAGEMENT`
- [ ] Transaction Multisender: `SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER`
- [ ] Create Liquidity: `SERVICE_IDENTIFIERS.CREATE_LIQUIDITY`

### **⭐ Comprehensive Error Handling Requirements:**

#### **Hook Layer Error Handling:**

- [ ] Use `SolanaError` with specific error codes for different scenarios
- [ ] Implement try-catch blocks around IPFS uploads, API calls, transaction operations
- [ ] Let `useToolBase` handle error processing with `getUserErrorMessageFromError`
- [ ] Add tool-specific error codes to `SOLANA_ERROR_CODES` if needed
- [ ] Follow Token Creator pattern as reference implementation

#### **API Route Error Handling:**

- [ ] Security validation error handling (`AppError` instances)
- [ ] Request validation with proper error codes (`APP_ERROR_CODES.VALIDATION_ERROR`)
- [ ] Solana address validation with specific error codes
- [ ] Business logic error handling with `SolanaError` instances
- [ ] Generic error fallback using `getUserErrorMessageFromError`
- [ ] Structured error responses following global strategy
- [ ] Comprehensive logging with context

#### **Server Utility Error Handling:**

- [ ] Throw `SolanaError` instances with specific error codes
- [ ] Handle network/RPC errors with appropriate error codes
- [ ] Balance validation errors with detailed messages
- [ ] Transaction construction errors with specific codes
- [ ] Structured logging for debugging

#### **Error Code Management:**

- [ ] Add tool-specific error codes to `solanaErrorCodes.ts` if needed
- [ ] Add corresponding user-friendly messages to `getSolanaErrorMessage.ts`
- [ ] Use existing generic error codes from `APP_ERROR_CODES` where appropriate
- [ ] Ensure error codes are specific and actionable

#### **User Experience:**

- [ ] Tool-specific success messages with transaction links
- [ ] Consistent loading states using toast system
- [ ] Error messages automatically routed through `getUserErrorMessageFromError`
- [ ] Appropriate toast durations (8000ms for errors, 10000ms for success)

### **Benefits Achieved:**

- ✅ **Simplified Architecture**: No server action duplication
- ✅ **Better Performance**: Client-side balance validation prevents unnecessary API calls
- ✅ **Type Safety**: End-to-end TypeScript with `apiClient`
- ✅ **Standard Patterns**: Familiar REST API approach
- ✅ **External Ready**: API routes can be used outside Next.js app
- ✅ **Easy Debugging**: Clear HTTP request/response flow
- ✅ **⭐ Comprehensive Error Handling**: Consistent error experience across all tools
- ✅ **⭐ User-Friendly Messages**: Automatic error message routing and user-friendly feedback
- ✅ **⭐ Robust Logging**: Structured logging for debugging and monitoring

---

## 🎯 **COMPLETE IMPLEMENTATION PATTERN FOR NEW TOOLS**

### **Step-by-Step Implementation Guide**

When implementing a new tool, follow this exact pattern for service fee and memo integration:

#### **1. Hook Implementation (use{ToolName}.ts)**

```typescript
import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useToolConfig } from '@/stores/toolConfigStore'
import { validateBalance } from '@/lib/solana/validateBalance'

export function useBurnTokens() {
  const { connection } = useConnection()
  const { config } = useToolConfig('burn-tokens') // Use actual tool ID

  const executeBurnTokens = useCallback(
    async (context, params) => {
      // Client-side balance validation using tool config
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'burn-tokens',
        formData: params,
        serviceFee: config?.baseFee ?? 0.01, // Dynamic from tool config
        networkFee: config?.networkFee ?? 0.0005, // Dynamic from tool config
      })

      if (!balanceValidation.hasSufficientBalance) {
        const errorMessage = `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL (including ${config?.baseFee?.toFixed(4) ?? '0.0100'} SOL service fee), but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        throw new SolanaError(errorMessage, SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
      }

      // ... rest of implementation
    },
    [connection, config?.baseFee, config?.networkFee] // Include config dependencies
  )

  const toolBase = useToolBase({ toolId: 'burn-tokens', requiresWallet: true }, executeBurnTokens)
  return { burnTokens: toolBase.execute, ...toolBase }
}
```

#### **2. Server Utility Implementation (create{ToolName}Transaction.ts)**

```typescript
import 'server-only'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from './serviceMemo'
import getServerConfig from '@/lib/config/getServerConfig'

export async function createBurnTokenTransaction(params) {
  const serverConfig = getServerConfig()
  const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')

  // STEP 1: Service fee calculation using tool config
  let totalServiceFeeSOL = 0
  try {
    const toolConfig = await getToolConfigFromCache('burn-tokens') // Use actual tool ID
    if (toolConfig?.baseFee) {
      totalServiceFeeSOL = toolConfig.baseFee
    }
  } catch (error) {
    logger.warn('Failed to get tool config for base fee, using zero', { error: String(error) })
  }

  // STEP 2: Enhanced balance validation including service fees
  const walletBalance = await connection.getBalance(walletPublicKey)
  const estimatedCostSOL = 0.0001 + totalServiceFeeSOL

  if (walletBalance < estimatedCostSOL * LAMPORTS_PER_SOL) {
    throw new SolanaError(
      `Insufficient SOL balance. Required: ${estimatedCostSOL.toFixed(4)} SOL (including ${totalServiceFeeSOL.toFixed(4)} SOL service fee), Available: ${(walletBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`,
      SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
    )
  }

  // STEP 3: Transaction construction with required instruction order
  const transaction = new Transaction()
  const { blockhash } = await connection.getLatestBlockhash('confirmed')
  transaction.recentBlockhash = blockhash
  transaction.feePayer = walletPublicKey

  // INSTRUCTION 1: Service memo (ALWAYS FIRST)
  transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_BURNER)) // Use appropriate identifier

  // INSTRUCTION 2: Service fee transfer (if applicable)
  if (totalServiceFeeSOL > 0) {
    const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
    const serviceFeeAmount = Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL)

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: serviceFeeWallet,
        lamports: serviceFeeAmount,
      })
    )
  }

  // INSTRUCTION 3+: Tool-specific instructions
  transaction.add(burnInstruction) // Your tool's main instruction

  return {
    transaction,
    // ... other response data
  }
}
```

#### **3. Required Imports Checklist**

**Hook Level:**

```typescript
import { useToolConfig } from '@/stores/toolConfigStore'
import { validateBalance } from '@/lib/solana/validateBalance'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
```

**Server Utility Level:**

```typescript
import 'server-only'
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from './serviceMemo'
import getServerConfig from '@/lib/config/getServerConfig'
```

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

### 5. Tool Helpers (`lib/utils/toolHelpers.ts`) ⭐ **NEW**

**Central tool configuration and business logic utilities:**

```typescript
export type ToolType =
  | 'burn-tokens'
  | 'revoke-mint-authority'
  | 'revoke-freeze-authority'
  | 'freeze-accounts'
  | 'unfreeze-accounts'
  | 'create-liquidity'
  | 'token-creator'
  | 'all'

// Tool configuration with requirements and cache settings
export const TOOL_CONFIGS: Record<ToolType, ToolConfig> = {
  'token-creator': {
    requiresAuthorities: false,
    requiresNonZeroBalance: false,
    cacheTime: 900000, // 15 minutes - longer since this is for validation/reference
    description: 'Create new SPL tokens with metadata and authorities',
  },
  // ... other tool configurations
}

// Shared business logic functions
export function shouldIncludeAuthorities(toolType: ToolType): boolean
export function getStaleTimeForTool(toolType: ToolType): number
export function getToolConfig(toolType: ToolType): ToolConfig
export function getToolDisplayName(toolType: ToolType): string
```

### 6. Optimized Wallet Token Fetching (`lib/solana/getWalletTokensServer.ts`) ⭐ **NEW**

**Server-side optimized token fetching with tool-specific filtering:**

```typescript
export async function getWalletTokensServer(params: GetWalletTokensParams): Promise<TokenData[]> {
  // Optimized RPC batching and filtering
  // Tool-specific requirements (authorities, balances)
  // Efficient data transformation and caching
}
```

### 7. Tool-Specific Optimized Hooks (`hooks/queries/useWalletTokensForToolOptimized.ts`) ⭐ **NEW**

**Client-side hooks with server-side optimization and tool configuration:**

```typescript
// Main hook with tool-specific optimization
export function useWalletTokensForTool(toolType: ToolType)

// Convenience hooks for each tool
export const useBurnTokenWalletTokens = () => useWalletTokensForTool('burn-tokens')
export const useTokenCreatorWalletTokens = () => useWalletTokensForTool('token-creator')
export const useFreezeAccountsWalletTokens = () => useWalletTokensForTool('freeze-accounts')
// ... other tool-specific hooks
```

**Key Features:**

- **Server-side optimization**: Reduces RPC calls and client processing
- **Tool-specific filtering**: Only fetches data required by each tool
- **Smart caching**: Different cache times based on tool requirements
- **Consistent API**: Unified interface across all tools

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

## 🚨 **COMPREHENSIVE ERROR HANDLING STRATEGY**

### **Two-Tier Error Code Architecture**

Following the global error handling strategy documented in `ERROR_HANDLING_STRATEGY.md`:

```typescript
// Generic Application Errors
APP_ERROR_CODES.VALIDATION_ERROR
APP_ERROR_CODES.NETWORK_ERROR
APP_ERROR_CODES.INTERNAL_ERROR

// Domain-Specific Solana Errors
SOLANA_ERROR_CODES.WALLET_NOT_CONNECTED
SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
SOLANA_ERROR_CODES.METADATA_UPLOAD_FAILED
SOLANA_ERROR_CODES.TRANSACTION_FAILED
```

### **Error Classes & User-Friendly Messages**

**Core Error Classes:**

```typescript
// Base application error
export class AppError extends Error {
  public readonly status: number
  public readonly code: string
  constructor(message: string, code: string, status: number = 500) {
    super(message)
    this.code = code
    this.status = status
  }
}

// Solana-specific error
export class SolanaError extends AppError {
  constructor(message: string, code: SolanaErrorCode, status: number = 400) {
    super(message, code, status)
  }
}
```

**User-Friendly Message System:**

```typescript
// Main error processing utility
import { getUserErrorMessageFromError } from '@/lib/utils/getUserErrorMessageFromError'

// Automatically routes to appropriate message handler:
// - getSolanaErrorMessage() for SOLANA_ERROR_CODES
// - getAppErrorMessage() for APP_ERROR_CODES
// - Fallback for unknown errors

const userFriendlyMessage = getUserErrorMessageFromError(error)
```

### **Hook Layer Error Handling** ⭐ **REFERENCE IMPLEMENTATION**

**Token Creator Pattern** (use as template for all tools):

```typescript
export function useTokenCreator() {
  const executeTokenCreation = useCallback(
    async (context, params) => {
      try {
        // Business logic here...

        // Client-side IPFS uploads with specific error codes
        if (params.logo) {
          try {
            const logoResponse = await uploadImageToIPFS(params.logo)
            logoUri = logoResponse.uri
          } catch (error) {
            // Use specific error codes for different failure scenarios
            if (error.message.includes('network')) {
              throw new SolanaError(
                'Failed to connect to IPFS service. Please check your internet connection.',
                SOLANA_ERROR_CODES.IPFS_CONNECTION_FAILED
              )
            }
            throw new SolanaError('Failed to upload token logo. Please try again.', SOLANA_ERROR_CODES.IMAGE_UPLOAD_FAILED)
          }
        }

        // Metadata upload with specific error handling
        if (logoUri || description) {
          try {
            const metadataResponse = await uploadJSONToIPFS(metadata)
            metadataUri = metadataResponse.uri
          } catch (error) {
            throw new SolanaError('Failed to upload token metadata. Please try again.', SOLANA_ERROR_CODES.METADATA_UPLOAD_FAILED)
          }
        }

        // API call with type-safe error handling
        const tokenResponse = await apiClient<TokenCreatorRequest, UnsignedTokenCreationResponse>('/api/solana/token-creator', requestBody)

        // Client-side transaction handling...
      } catch (error: unknown) {
        // Let useToolBase handle error processing using global error handling strategy
        throw error // Will be processed by useToolBase error handling
      }
    },
    [connection, config]
  )

  // useToolBase provides consistent error handling across all tools
  const toolBase = useToolBase({ toolId: 'token-creator', toolName: 'Token Creator', requiresWallet: true }, executeTokenCreation)

  return { createToken: toolBase.execute, ...toolBase }
}
```

### **useToolBase Error Processing** ⭐ **STANDARDIZED PATTERN**

**Consistent Error Handling Across All Tools:**

```typescript
export function useToolBase<TData, TResult>(config, executionFn) {
  const execute = useCallback(
    async (data: TData): Promise<TResult | null> => {
      try {
        const result = await executionFn(context, data)
        setLastResult(result)

        // Don't show generic success toast - let specific tools handle their own success messaging
        toast.dismiss(`${config.toolId}-loading`)
        return result
      } catch (error: unknown) {
        logger.error(`${config.toolName} execution failed`, error, {
          toolId: config.toolId,
          wallet: context.walletAddress,
          timestamp: new Date().toISOString(),
        })

        // Use global error handling strategy for consistent user experience
        const userFriendlyMessage = getUserErrorMessageFromError(error)

        toast.error(userFriendlyMessage, {
          id: `${config.toolId}-error`,
          duration: 8000, // Longer duration for error messages
        })

        return null
      } finally {
        setIsExecuting(false)
        toast.dismiss(`${config.toolId}-loading`)
      }
    },
    [config, executionFn]
  )

  return { execute, ...otherMethods }
}
```

### **API Route Error Handling** ⭐ **GLOBAL STRATEGY COMPLIANCE**

**Comprehensive Server-Side Error Processing:**

```typescript
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Security validation
    await validateSecurity(request, { skipForLocalhost: true })

    // Request validation
    const validation = validateRequestBody(body, toolRequestSchema)
    if (!validation.success) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: `Validation failed: ${validation.errors}`,
          error_code: APP_ERROR_CODES.VALIDATION_ERROR,
          data: null,
        },
        { status: 400 }
      )
    }

    // Solana address validation
    let walletPublicKey: PublicKey
    try {
      walletPublicKey = new PublicKey(validatedData.walletAddress)
    } catch {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Invalid wallet address format',
          error_code: SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS,
          data: null,
        },
        { status: 400 }
      )
    }

    // Business logic
    const result = await toolUtilityFunction(validatedData)

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: result,
    })
  } catch (error: unknown) {
    logger.error('Tool API error', error, {
      wallet: request.headers.get('user-agent') ? 'present' : 'missing',
    })

    // **GLOBAL ERROR HANDLING STRATEGY IMPLEMENTATION**

    // Handle security validation errors (AppError)
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: error.status,
          error_message: error.message,
          error_code: error.code,
          data: null,
        },
        { status: error.status }
      )
    }

    // Handle Solana-specific errors (SolanaError)
    if (error instanceof SolanaError) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: error.status,
          error_message: error.message,
          error_code: error.code,
          data: null,
        },
        { status: error.status }
      )
    }

    // Handle all other errors using global error handling strategy
    const userFriendlyMessage = getUserErrorMessageFromError(error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: userFriendlyMessage,
        error_code: APP_ERROR_CODES.INTERNAL_ERROR,
        data: null,
      },
      { status: 500 }
    )
  }
}
```

### **Server Utility Error Handling**

**Specific Error Codes for Different Scenarios:**

```typescript
export async function createToolTransaction(params) {
  try {
    // Balance validation with specific error
    if (walletBalance < totalRequiredLamports) {
      throw new SolanaError(
        `Insufficient balance. Required: ${totalRequiredSOL} SOL, Available: ${currentBalanceSOL} SOL`,
        SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
      )
    }

    // Transaction construction with error handling
    const transaction = new Transaction()

    // ... transaction building logic

    return { transaction, success: true }
  } catch (error: unknown) {
    logger.error('Transaction creation failed', error, {
      wallet: params.walletAddress,
      tool: 'token-creator',
    })

    // Re-throw with specific error codes based on failure type
    if (error instanceof SolanaError) {
      throw error // Already has specific error code
    }

    // Network/RPC errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      throw new SolanaError('Network connection failed. Please check your internet connection.', SOLANA_ERROR_CODES.NETWORK_ERROR)
    }

    // Generic fallback
    throw new SolanaError('Transaction preparation failed. Please try again.', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
  }
}
```

### **Error Code Categories for Tools**

**Tool-Specific Error Codes** (add as needed):

```typescript
// Token Creator specific errors
SOLANA_ERROR_CODES.METADATA_UPLOAD_FAILED
SOLANA_ERROR_CODES.IMAGE_UPLOAD_FAILED
SOLANA_ERROR_CODES.IPFS_CONNECTION_FAILED
SOLANA_ERROR_CODES.METADATA_PROCESSING_FAILED
SOLANA_ERROR_CODES.INVALID_METADATA_FORMAT
SOLANA_ERROR_CODES.METADATA_SIZE_EXCEEDED

// Burn Tokens specific errors
SOLANA_ERROR_CODES.INSUFFICIENT_TOKEN_BALANCE
SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND
SOLANA_ERROR_CODES.INVALID_BURN_AMOUNT

// Liquidity specific errors
SOLANA_ERROR_CODES.POOL_NOT_FOUND
SOLANA_ERROR_CODES.SLIPPAGE_EXCEEDED
SOLANA_ERROR_CODES.INSUFFICIENT_LIQUIDITY
```

### **User Feedback Strategy**

**Success Messages:**

```typescript
// Tool-specific success messages with transaction links
toast.success(
  <div>
    <p>Token created successfully!</p>
    <ExplorerLink signature={signature} type="transaction" />
  </div>,
  { duration: 10000 }
)
```

**Error Messages:**

```typescript
// Automatic user-friendly error messages via getUserErrorMessageFromError
toast.error(userFriendlyMessage, {
  id: `${toolId}-error`,
  duration: 8000, // Longer for errors
})
```

**Loading States:**

```typescript
// Consistent loading messages
toast.loading(`Creating token...`, {
  id: `${toolId}-loading`,
})
```

### **Error Handling Checklist for New Tools**

When implementing error handling for a new tool:

- [ ] **Hook Layer**: Use `SolanaError` with specific error codes for different failure scenarios
- [ ] **Hook Layer**: Let `useToolBase` handle error processing with `getUserErrorMessageFromError`
- [ ] **API Route**: Implement comprehensive error handling following global strategy pattern
- [ ] **API Route**: Handle `AppError`, `SolanaError`, and generic errors separately
- [ ] **Server Utility**: Throw specific `SolanaError` instances with appropriate error codes
- [ ] **Error Codes**: Add tool-specific error codes to `SOLANA_ERROR_CODES` if needed
- [ ] **User Messages**: Add corresponding user-friendly messages to `getSolanaErrorMessage.ts`
- [ ] **Testing**: Verify error propagation from server utility → API route → hook → user toast
- [ ] **Logging**: Use structured logging with context for debugging
- [ ] **Consistency**: Follow Token Creator pattern as reference implementation

## Security Considerations

1. **Origin Validation**: All API routes validate request origin
2. **Ownership Validation**: Server validates user owns token accounts
3. **Balance Validation**: Client-side pre-validation using public RPC for performance
4. **Private RPC**: Sensitive operations use private RPC endpoints
5. **Transaction Signing**: All transactions signed client-side, never server-side

## Implementation Checklist

When creating a new tool, ensure:

### **Core Architecture:**

- [ ] Shared Zod schema in `/lib/schemas/apiSchemas.ts`
- [ ] Form schema using shared validation patterns
- [ ] Page component with proper data transformation
- [ ] Hook using `useToolBase` pattern with type-safe API calls
- [ ] Client-side balance validation utility (for tools with transaction costs)
- [ ] Client-side balance validation in hook before API calls
- [ ] API route with comprehensive validation and error handling
- [ ] Utility function with pure business logic and 'server-only' directive
- [ ] Proper RPC endpoint usage (public for client, private for server)
- [ ] Type definitions in `/types/api.ts`

### **⭐ Comprehensive Error Handling (NEW REQUIREMENTS):**

- [ ] **Hook Layer**: Use `SolanaError` with specific error codes following Token Creator pattern
- [ ] **Hook Layer**: Implement error handling for IPFS uploads, API calls, transactions
- [ ] **Hook Layer**: Let `useToolBase` handle error processing with global error handling strategy
- [ ] **API Route**: Handle `AppError`, `SolanaError`, and generic errors separately
- [ ] **API Route**: Use `getUserErrorMessageFromError` for consistent error processing
- [ ] **Server Utility**: Throw `SolanaError` instances with specific error codes
- [ ] **Error Codes**: Add tool-specific codes to `SOLANA_ERROR_CODES` if needed
- [ ] **User Messages**: Add corresponding messages to `getSolanaErrorMessage.ts`
- [ ] **Testing**: Verify error propagation from utility → API route → hook → user toast

### **Security & Validation:**

- [ ] Security validation in API routes using `validateSecurity`
- [ ] Multi-layer validation (client Zod + server Zod + Solana PublicKey)
- [ ] Ownership validation for token operations
- [ ] Balance validation with specific error handling

### **User Experience:**

- [ ] Comprehensive logging with structured data
- [ ] Toast notifications with proper error handling
- [ ] Success messages with transaction links (`ExplorerLink`)
- [ ] Loading states with consistent messaging
- [ ] Error messages routed through global error handling strategy

### **Service Integration:**

- [ ] Transaction preparation server-side, signing client-side
- [ ] Service fee collection and memo integration
- [ ] Service identifier tracking for analytics

## Benefits of This Architecture

1. **Type Safety**: End-to-end TypeScript ensures correctness
2. **Validation Consistency**: Shared schemas prevent client/server discrepancies
3. **Security**: Multiple validation layers and proper RPC usage
4. **Performance**: Private RPC for server operations prevents rate limiting
5. **User Experience**: Proper error handling and feedback
6. **Maintainability**: Clear separation of concerns and reusable patterns
7. **Scalability**: Standardized patterns make adding new tools straightforward

## ⭐ **REFERENCE IMPLEMENTATIONS**

### **Primary Reference: Token Creator** (Complete Error Handling Implementation)

Use the **Token Creator** as the definitive reference for comprehensive error handling:

- **Hook**: `src/hooks/solana/useTokenCreator.ts` - ⭐ **Complete error handling pattern**
- **API Route**: `src/app/api/solana/token-creator/route.ts` - ⭐ **Global error strategy implementation**
- **Server Utility**: `src/lib/solana/createTokenCreationTransaction.ts` - ⭐ **Specific error codes**
- **Form**: `src/components/pages/TokenCreatorPage/TokenForm/`
- **Page**: `src/app/tools/token-creator/page.tsx`
- **Types**: `src/types/tokenCreator.ts`
- **Schema**: `src/lib/schemas/apiSchemas.ts` (tokenCreatorRequestSchema)

### **Secondary Reference: Burn Tokens** (Basic Implementation)

For simpler tools without IPFS integration:

- Form: `src/components/pages/BurnTokensPage/BurnForm/`
- Page: `src/app/tools/burn-tokens/page.tsx`
- Hook: `src/hooks/solana/useBurnTokens.ts`
- API: `src/app/api/solana/burn-tokens/route.ts`
- Utility: `src/lib/solana/burnToken.ts`
- Schema: `src/lib/schemas/apiSchemas.ts` (burnTokensRequestSchema)
- Types: `src/types/api.ts` (BurnTokensRequest, UnsignedBurnTransactionResponse)

### **Error Handling Reference Files**

**Core Error Handling System:**

- `src/lib/utils/getUserErrorMessageFromError.ts` - ⭐ **Main error processing function**
- `src/lib/utils/getSolanaErrorMessage.ts` - User-friendly Solana error messages
- `src/lib/utils/getAppErrorMessage.ts` - User-friendly app error messages
- `src/lib/utils/solanaErrorCodes.ts` - Solana-specific error codes
- `src/lib/utils/appErrorCodes.ts` - Generic application error codes
- `src/types/error.ts` - Error type definitions
- `src/hooks/solana/useToolBase.ts` - ⭐ **Standardized error processing for all tools**

**Documentation:**

- `docs/ERROR_HANDLING_STRATEGY.md` - ⭐ **Complete error handling documentation**
- `docs/TOKEN_CREATOR_VALIDATION_REPORT.md` - Implementation validation
- `docs/SERVICE_MEMO_IMPLEMENTATION.md` - Service memo integration guide

---

## 🔥 **FINAL IMPLEMENTATION CHECKLIST FOR NEW TOOLS**

Use this checklist to ensure your new tool follows all architectural requirements:

### **✅ Core Architecture Requirements**

#### **Hook Layer (use{ToolName}.ts):**

- [ ] Import `useToolConfig` from `@/stores/toolConfigStore`
- [ ] Import `createConnectionPair` and `confirmTransactionWithParallelStrategy` for optimal performance
- [ ] Get tool config: `const { config } = useToolConfig('tool-id')`
- [ ] Use config in balance validation: `serviceFee: config?.baseFee ?? 0.01`
- [ ] Include config in dependency array: `[connection, config?.baseFee, config?.networkFee]`
- [ ] Enhanced error message with service fee breakdown
- [ ] Import and use `SolanaError` with specific error codes
- [ ] Use `useToolBase` for consistent error handling
- [ ] **Use parallel confirmation**: `confirmTransactionWithParallelStrategy` with connection pair for optimal user experience

#### **Server Utility (create{ToolName}Transaction.ts):**

- [ ] Include `'server-only'` directive at top of file
- [ ] Import: `SystemProgram, LAMPORTS_PER_SOL` from `@solana/web3.js`
- [ ] Import: `getToolConfigFromCache` from `@/lib/contentful/toolConfigCache`
- [ ] Import: `createServiceMemoInstruction, SERVICE_IDENTIFIERS` from `./serviceMemo`
- [ ] Get tool config: `const toolConfig = await getToolConfigFromCache('tool-id')`
- [ ] Calculate service fee: `totalServiceFeeSOL = toolConfig?.baseFee || 0`
- [ ] Include service fee in balance validation with detailed error message
- [ ] **INSTRUCTION 1**: Add service memo first: `createServiceMemoInstruction(SERVICE_IDENTIFIERS.{TOOL})`
- [ ] **INSTRUCTION 2**: Add service fee transfer if `totalServiceFeeSOL > 0`
- [ ] **INSTRUCTION 3+**: Add tool-specific instructions
- [ ] Use appropriate service identifier for your tool
- [ ] Handle tool config loading errors gracefully (log warning, continue with zero fee)

#### **API Route (api/solana/{tool-name}/route.ts):**

- [ ] Follow global error handling strategy pattern
- [ ] Handle `AppError`, `SolanaError`, and generic errors separately
- [ ] Use `getUserErrorMessageFromError` for unknown errors
- [ ] Comprehensive error logging with context
- [ ] Return proper HTTP status codes for different error types

### **✅ Service Identifier Mapping**

Choose the correct service identifier for your tool:

- [ ] Token Creator: `SERVICE_IDENTIFIERS.TOKEN_CREATOR`
- [ ] Burn Tokens: `SERVICE_IDENTIFIERS.TOKEN_BURNER`
- [ ] Freeze Accounts: `SERVICE_IDENTIFIERS.FREEZE_ACCOUNTS`
- [ ] Unfreeze Accounts: `SERVICE_IDENTIFIERS.UNFREEZE_ACCOUNTS`
- [ ] Authority Management: `SERVICE_IDENTIFIERS.AUTHORITY_MANAGEMENT`
- [ ] Transaction Multisender: `SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER`
- [ ] Create Liquidity: `SERVICE_IDENTIFIERS.CREATE_LIQUIDITY`

### **✅ Required Imports Verification**

#### **Hook Level Imports:**

```typescript
import { useToolConfig } from '@/stores/toolConfigStore'
import { validateBalance } from '@/lib/solana/validateBalance'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { createConnectionPair } from '@/lib/solana/connectionPair'
import { confirmTransactionWithParallelStrategy } from '@/lib/solana/confirmTransactionWithParallelStrategy'
```

#### **Server Utility Level Imports:**

```typescript
import 'server-only'
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from './serviceMemo'
import getServerConfig from '@/lib/config/getServerConfig'
```

### **✅ Transaction Instruction Order Verification**

Ensure your transaction follows this exact order:

1. **Service Memo**: `createServiceMemoInstruction(SERVICE_IDENTIFIERS.{TOOL})`
2. **Service Fee Transfer**: `SystemProgram.transfer()` (if `totalServiceFeeSOL > 0`)
3. **Tool Instructions**: Your tool-specific instructions (burn, mint, transfer, etc.)

### **✅ Error Handling Compliance**

- [ ] Use specific `SolanaError` codes for different failure scenarios
- [ ] Include service fee amounts in error messages
- [ ] Follow Token Creator pattern for error handling structure
- [ ] Use `getUserErrorMessageFromError` in API routes for unknown errors
- [ ] Provide detailed balance validation errors with fee breakdowns
- [ ] Log structured error data for debugging

### **✅ Testing Verification**

- [ ] Test with insufficient SOL balance to verify error message includes service fee
- [ ] Verify service memo appears in transaction on Solana Explorer
- [ ] Confirm service fee transfer appears in transaction when `baseFee > 0`
- [ ] Test tool config loading failure scenario (should log warning, continue with zero fee)
- [ ] Verify transaction instruction order is correct
- [ ] Test error propagation from server utility → API route → hook → user toast
- [ ] **Verify parallel confirmation**: Test that transactions confirm faster using `confirmTransactionWithParallelStrategy`
- [ ] **Test confirmation fallback**: Ensure proper error handling if parallel confirmation fails

### **✅ Documentation Updates**

- [ ] Add tool to SERVICE_IDENTIFIERS mapping in this guide if new identifier needed
- [ ] Update tool configuration in Contentful with appropriate base fee
- [ ] Add tool to fee configs in `src/lib/utils/feeConfigs.ts` if additional fees needed

**🎯 COMPLETION CRITERIA:** Your tool implementation is complete when all checkboxes are verified and the tool follows the exact patterns established by Token Creator and Burn Tokens reference implementations, including parallel transaction confirmation for optimal performance.

This architecture ensures all Solana tools follow consistent, secure, and maintainable patterns while providing excellent user experience and developer productivity with comprehensive service fee collection, on-chain usage tracking, and optimized transaction confirmation.
