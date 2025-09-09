# Solana Tool Architecture Guide

## Overview

This guide outlines the standardized architecture pattern for building Solana tools in the SolCloak application. The Burn Token service serves as the reference implementation, demonstrating a complete validation workflow from client-side forms to server-side utility functions.

## Architecture Validation Summary ✅

The Burn Token implementation demonstrates a **complete, secure, and well-architected solution** with:

- ✅ **Unified Validation**: Shared Zod schemas across client and server
- ✅ **Type Safety**: End-to-end TypeScript types from form to API
- ✅ **Security**: Origin validation, ownership checks, balance validation
- ✅ **Performance**: Private RPC for server operations, public RPC for client
- ✅ **Error Handling**: Comprehensive error propagation with specific codes
- ✅ **User Experience**: Toast notifications, loading states, proper feedback
- ✅ **Code Quality**: Clean separation of concerns, reusable utilities

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

### 3. Hook Layer (`hooks/solana/use{ToolName}.ts`)

**Responsibilities:**

- Business logic orchestration
- Client-side balance validation (fast pre-check before API calls)
- Type-safe API communication
- Transaction signing and submission
- User feedback (toasts, loading states)
- Error handling with user-friendly messages

**Architecture:**

```typescript
export function useToolName(): UseToolBaseReturn<ToolParams, ToolResult> & {
  toolFunction: (params: ToolParams) => Promise<ToolResult | null>
} {
  const { connection } = useConnection() // Public RPC for transaction submission

  const executeOperation = useCallback(
    async (context: ToolExecutionContext, params: ToolParams): Promise<ToolResult> => {
      // 1. Parameter validation
      // 2. Client-side balance validation (using public RPC)
      // 3. API call using type-safe client
      // 4. Transaction deserialization
      // 5. Transaction signing
      // 6. Transaction submission
      // 7. Result formatting
    },
    [connection]
  )

  const toolBase = useToolBase<ToolParams, ToolResult>(
    {
      toolId: 'tool-name',
      toolName: 'Tool Display Name',
      requiresWallet: true,
    },
    executeOperation
  )

  const toolFunction = useCallback(
    async (params: ToolParams) => {
      // Toast notifications
      // Error handling with specific messages
      // Result processing
    },
    [toolBase]
  )

  return { toolFunction, ...toolBase }
}
```

**Key Patterns:**

- Use `useToolBase` for consistent error handling and loading states
- Client-side balance validation before API calls for better performance
- Type-safe API calls with `apiClient<RequestType, ResponseType>`
- Public RPC connection for transaction submission and balance checks
- Comprehensive error handling with specific user messages
- Toast notifications for user feedback

#### Client-Side Balance Validation Pattern

For tools that involve transaction costs, implement client-side balance validation before making API calls using the generic `validateBalance` utility:

```typescript
// Import the generic balance validation utility
import { validateBalance, validateTokenCreationBalance } from '@/lib/solana/validateBalance'

const executeOperation = useCallback(
  async (context: ToolExecutionContext, params: ToolParams): Promise<ToolResult> => {
    // 1. Parameter validation
    if (!params.name || !params.symbol) {
      throw new SolanaError('Invalid parameters', SOLANA_ERROR_CODES.INVALID_INPUT)
    }

    // 2. Client-side balance validation (fast pre-check)
    const walletPublicKey = new PublicKey(context.walletAddress)

    // Option A: Use generic validateBalance for any tool
    const balanceValidation = await validateBalance({
      walletPublicKey,
      connection, // Public RPC connection
      serviceId: 'token-creator', // Tool identifier
      formData: {
        revokeMintAuthority: params.revokeMintAuthority,
        revokeFreezeAuthority: params.revokeFreezeAuthority,
      },
    })

    // Option B: Use specific helper for token creation (backward compatibility)
    const balanceValidation = await validateTokenCreationBalance({
      walletPublicKey,
      revokeMintAuthority: params.revokeMintAuthority,
      revokeFreezeAuthority: params.revokeFreezeAuthority,
      connection, // Public RPC connection
    })

    if (!balanceValidation.hasSufficientBalance) {
      const errorMessage = `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL (including ${balanceValidation.serviceFee.toFixed(4)} SOL service fee), but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`

      logger.warn('Insufficient wallet balance detected client-side', balanceValidation)
      throw new SolanaError(errorMessage, SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
    }

    // 3. Continue with API call (balance already validated)
    const response = await apiClient<RequestType, ResponseType>('/api/solana/tool-name', requestBody)

    // ... rest of the implementation
  },
  [connection]
)
```

**Benefits of Client-Side Balance Validation:**

- **Performance**: Fast pre-validation prevents unnecessary API calls
- **User Experience**: Immediate feedback without server round-trip
- **Cost Accuracy**: Uses toolFeeConfigs for precise fee calculation
- **Resource Efficiency**: Reduces server load and API call costs

**Implementation Requirements:**

- Create a `validateBalanceFor{ToolName}` utility function
- Use public RPC connection for balance checks
- Integrate with `toolFeeConfigs` for accurate fee calculation
- Provide detailed error messages with cost breakdown

### 4. API Route Layer (`app/api/solana/{tool-name}/route.ts`)

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

### 5. Utility Layer (`lib/solana/{toolName}.ts`)

**Responsibilities:**

- Pure business logic functions
- Transaction construction
- Comprehensive validation using private RPC
- Error handling with specific error codes
- No side effects (logging, etc.)

**Structure:**

```typescript
export interface ToolParams {
  walletPublicKey: PublicKey
  // ... other parameters
}

export interface ToolResult {
  transaction: Transaction
  // ... other result data
}

export async function createToolTransaction(params: ToolParams): Promise<ToolResult> {
  const { walletPublicKey, ...otherParams } = params

  // Create connection using server config
  const serverConfig = getServerConfig()
  const connection = new Connection(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'tool-name',
    function: 'createToolTransaction',
    wallet: walletPublicKey.toString(),
  })

  try {
    // 1. Input validation
    // 2. Comprehensive business validation using private RPC
    // 3. Transaction construction
    // 4. Return structured result

    return {
      transaction,
      // ... other result data
    }
  } catch (error) {
    // Error enhancement and re-throwing
    throw new SolanaError('Operation failed', ERROR_CODE, status)
  }
}
```

**Key Patterns:**

- Pure functions with no side effects
- Use server config for private RPC access
- Comprehensive validation to prevent failed transactions
- Structured error handling with specific codes
- Detailed logging for debugging

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
