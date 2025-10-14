# 🛠️ CloakForge Tool Implementation Guide

> **Complete guide for implementing new Solana tools following CloakForge patterns**

Last updated: 2025-10-14

## 📋 Table of Contents

- [Tool Architecture Overview](#tool-architecture-overview)
- [Quick Start Checklist](#quick-start-checklist)
- [Implementation Layers](#implementation-layers)
- [Tool Configuration System](#tool-configuration-system)
- [Reference Implementations](#reference-implementations)

---

## 🎯 Tool Architecture Overview

### Design Principles for Tools

Every CloakForge tool follows these **core principles**:

1. **KISS (Keep It Simple)** - Simple, clear implementation without over-engineering
2. **DRY (Don't Repeat Yourself)** - Reuse existing utilities and components
3. **Clear Purpose** - Each layer has one responsibility
4. **Developer-First** - Consistent patterns, easy to understand
5. **Maintainability** - Easy to modify and extend

**When building a tool, always ask:**

- Is this the simplest solution? (KISS)
- Does this already exist? (DRY)
- What is the ONE thing this layer does? (Clear Purpose)
- Will another developer understand this? (Developer-First)
- Can this be easily changed? (Maintainability)

### Hybrid Architecture Pattern

CloakForge uses a **hybrid client-server architecture** for optimal performance and security:

```
User Form → Hook → Client Balance Check → API Route (Server) →
   Server Utility → Unsigned Transaction → Hook →
      Client Signing → Client Submission → Confirmation
```

**Key Benefits:**

- ✅ Fast client-side pre-validation (Developer-First)
- ✅ Server-side transaction preparation with private RPC (Clear Purpose)
- ✅ Client-side signing for security (KISS)
- ✅ No rate limiting with private RPC (Maintainability)
- ✅ Standard REST API patterns (DRY)

### Architecture Layers

```
┌─────────────────────────────────────────────┐
│  1. Form Layer (User Input & Validation)    │
│     - React Hook Form + Zod                 │
│     - Client-side validation                │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  2. Page Layer (Form Handling)              │
│     - Data transformation                   │
│     - Hook integration                      │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  3. Hook Layer (Orchestration)              │
│     - Balance validation (client)           │
│     - API calls                             │
│     - Transaction signing                   │
│     - Submission & confirmation             │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  4. API Route Layer (Server Validation)     │
│     - Request validation                    │
│     - Security checks                       │
│     - Call server utility                   │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  5. Server Utility Layer (Business Logic)   │
│     - Transaction preparation               │
│     - Fee calculation                       │
│     - Service fee collection                │
│     - Return unsigned transaction           │
└─────────────────────────────────────────────┘
```

---

## ✅ Quick Start Checklist

### Before You Start

- [ ] Read the [Architecture Guide](./ARCHITECTURE.md)
- [ ] Review [Token Creator](../src/hooks/solana/useTokenCreator.ts) (reference implementation)
- [ ] Check `src/components/common/` for reusable components
- [ ] Check `src/lib/` for existing utilities

### Required Files

Create these files for your new tool:

```
src/
├── app/
│   ├── tools/
│   │   └── my-tool/
│   │       └── page.tsx                        # Page component
│   └── api/
│       └── solana/
│           └── my-tool/
│               └── route.ts                    # API route
├── components/
│   └── pages/
│       └── MyToolPage/
│           ├── index.tsx                       # Main page wrapper
│           ├── MyToolForm/
│           │   ├── index.tsx                   # Form component
│           │   ├── FormSections.tsx            # Form fields
│           │   └── schema.ts                   # Zod validation
│           └── FAQSection/                     # Tool-specific FAQ
├── hooks/
│   └── solana/
│       └── useMyTool.ts                        # Hook implementation
├── lib/
│   └── solana/
│       └── createMyToolTransaction.ts          # Server utility (server-only)
└── types/
    └── myTool.ts                               # Type definitions
```

---

## 📝 Implementation Layers

### Layer 1: Form Schema

**Location**: `src/components/pages/MyToolPage/MyToolForm/schema.ts`

```tsx
import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const myToolFormSchema = z.object({
  tokenAddress: solanaAddressSchema,
  amount: z.number().min(0.000001, 'Amount must be greater than 0'),
  confirmed: z.boolean().refine((val) => val === true, 'You must confirm'),
})

export type MyToolFormData = z.infer<typeof myToolFormSchema>
```

**Best Practices:**

- Reuse shared validation schemas from `@/lib/schemas/apiSchemas`
- Include confirmation checkboxes for destructive operations
- Provide clear error messages

### Layer 2: Page Component

**Location**: `src/app/tools/my-tool/page.tsx`

```tsx
'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { MyToolForm } from '@/components/pages/MyToolPage/MyToolForm'
import { useMyTool } from '@/hooks/solana/useMyTool'
import { getLogger } from '@/lib/logger/logger'

export default function MyToolPage() {
  const { publicKey } = useWallet()
  const { execute } = useMyTool()
  const logger = getLogger({ context: 'my-tool', page: 'tools' })

  const handleSubmit = async (formData: MyToolFormData) => {
    try {
      const result = await execute({
        walletAddress: publicKey!.toString(),
        ...formData,
      })

      if (result) {
        logger.info('Operation successful', { signature: result.signature })
      }
    } catch (error) {
      logger.error('Operation failed', error)
      // Error handling done in hook
    }
  }

  return (
    <div>
      <MyToolForm onSubmit={handleSubmit} />
    </div>
  )
}
```

### Layer 3: Hook (Core Orchestration)

**Location**: `src/hooks/solana/useMyTool.ts`

```tsx
import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useToolConfig } from '@/stores/toolConfigStore'
import { validateBalance } from '@/lib/solana/validateBalance'
import { apiClient } from '@/lib/utils/apiClient'
import { useToolBase } from './useToolBase'
import { SolanaError, SOLANA_ERROR_CODES } from '@/types/error'

export function useMyTool() {
  const { connection } = useConnection()
  const { config } = useToolConfig('my-tool') // Get dynamic config

  const executeMyTool = useCallback(
    async (context, params) => {
      // STEP 1: Client-side balance validation (fast pre-check)
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'my-tool',
        formData: params,
        serviceFee: config?.baseFee ?? 0.01,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new SolanaError(
          `Insufficient funds. Need ${balanceValidation.estimatedCost.toFixed(4)} SOL`,
          SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
        )
      }

      // STEP 2: Call API route for transaction preparation
      const response = await apiClient<MyToolRequest, UnsignedTransactionResponse>('/api/solana/my-tool', params)

      // STEP 3: Client-side transaction signing
      const transaction = Transaction.from(Buffer.from(response.serializedTransaction, 'base64'))
      const signedTransaction = await context.signTransaction(transaction)

      // STEP 4: Submit and confirm transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      await connection.confirmTransaction(signature, 'confirmed')

      // STEP 5: User feedback
      showTransactionToast({ signature, type: 'my-tool' })

      return { ...response, signature, confirmed: true }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  const toolBase = useToolBase({ toolId: 'my-tool', requiresWallet: true }, executeMyTool)

  return { execute: toolBase.execute, ...toolBase }
}
```

**Key Requirements:**

- ✅ Use `useToolConfig` for dynamic fees
- ✅ Client-side balance validation before API call
- ✅ Use `apiClient` for type-safe API calls
- ✅ Use `useToolBase` for consistent error handling
- ✅ Include config in dependency array

### Layer 4: API Route

**Location**: `src/app/api/solana/my-tool/route.ts`

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { validateSecurity } from '@/lib/security/validateSecurity'
import { validateRequestBody } from '@/lib/utils/validateRequestBody'
import { myToolRequestSchema } from '@/lib/schemas/apiSchemas'
import { createMyToolTransaction } from '@/lib/solana/createMyToolTransaction'
import { getLogger } from '@/lib/logger/logger'
import type { ApiResponseBase, MyToolResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponseBase<MyToolResponse>>> {
  const logger = getLogger({ context: 'api', route: '/api/solana/my-tool' })

  try {
    // 1. Security validation
    await validateSecurity(request, { skipForLocalhost: true })

    // 2. Request validation
    const body = await request.json()
    const validation = validateRequestBody(body, myToolRequestSchema)

    if (!validation.success) {
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: `Validation failed: ${validation.errors}`,
          data: null,
        },
        { status: 400 }
      )
    }

    // 3. Call server utility
    const result = await createMyToolTransaction(validation.data)

    logger.info('Transaction prepared successfully')

    // 4. Return success response
    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: result,
    })
  } catch (error) {
    logger.error('API error', error)

    return NextResponse.json(
      {
        status: 'error',
        status_code: 500,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      },
      { status: 500 }
    )
  }
}
```

### Layer 5: Server Utility

**Location**: `src/lib/solana/createMyToolTransaction.ts`

```tsx
import 'server-only' // ⭐ REQUIRED

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getServerConfig } from '@/lib/config/getServerConfig'
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from './serviceMemo'
import { getLogger } from '@/lib/logger/logger'

export async function createMyToolTransaction(params: MyToolParams): Promise<MyToolResult> {
  const logger = getLogger({ context: 'solana', service: 'my-tool' })

  // 1. Setup: Private RPC connection
  const serverConfig = getServerConfig()
  const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')
  const walletPublicKey = new PublicKey(params.walletAddress)

  // 2. Service fee calculation from tool config
  let totalServiceFeeSOL = 0
  try {
    const toolConfig = await getToolConfigFromCache('my-tool')
    if (toolConfig?.baseFee) {
      totalServiceFeeSOL = toolConfig.baseFee
    }
  } catch (error) {
    logger.warn('Failed to get tool config, using zero fee', { error })
  }

  // 3. Enhanced balance validation (server-side double-check)
  const walletBalance = await connection.getBalance(walletPublicKey)
  const estimatedCostSOL = 0.0005 + totalServiceFeeSOL

  if (walletBalance < estimatedCostSOL * LAMPORTS_PER_SOL) {
    throw new Error(`Insufficient balance. Required: ${estimatedCostSOL.toFixed(4)} SOL`)
  }

  // 4. Transaction construction
  const transaction = new Transaction()
  const { blockhash } = await connection.getLatestBlockhash('confirmed')
  transaction.recentBlockhash = blockhash
  transaction.feePayer = walletPublicKey

  // ⭐ INSTRUCTION 1: Service memo (ALWAYS FIRST)
  transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.MY_TOOL))

  // ⭐ INSTRUCTION 2: Service fee transfer (if applicable)
  if (totalServiceFeeSOL > 0) {
    const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: serviceFeeWallet,
        lamports: Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL),
      })
    )
  }

  // ⭐ INSTRUCTION 3+: Tool-specific instructions
  // Add your tool's main instructions here
  // Example: burn tokens, freeze accounts, etc.

  // 5. Serialize and return unsigned transaction
  const serializedTransaction = transaction
    .serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })
    .toString('base64')

  return {
    serializedTransaction,
    totalServiceFee: totalServiceFeeSOL,
    estimatedNetworkFee: 0.0005,
  }
}
```

**Key Requirements:**

- ⭐ **`'server-only'` directive** at top
- ⭐ **Service fee from tool config**
- ⭐ **Service memo instruction FIRST**
- ⭐ **Service fee transfer SECOND** (if > 0)
- ⭐ **Tool instructions THIRD+**

---

## ⚙️ Tool Configuration System

### Contentful-Based Dynamic Configuration

CloakForge uses Contentful CMS for **remote tool control** without deployments.

#### Configuration Fields

```typescript
interface ToolConfiguration {
  toolId: string // 'token-creator', 'burn-tokens', etc.
  isEnabled: boolean // Remote enable/disable
  disabledMessage?: string // Message when disabled
  baseFee: number // Service fee in SOL
  networkFee: number // Estimated network fee
}
```

#### Using Tool Configuration

**In Hooks:**

```tsx
import { useToolConfig } from '@/stores/toolConfigStore'

export function useMyTool() {
  const { config } = useToolConfig('my-tool')

  // Use config fees in balance validation
  const serviceFee = config?.baseFee ?? 0.01
  const networkFee = config?.networkFee ?? 0.0005
}
```

**In Server Utilities:**

```tsx
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'

const toolConfig = await getToolConfigFromCache('my-tool')
const serviceFee = toolConfig?.baseFee || 0
```

#### Smart Button Integration

Replace regular submit buttons with `ToolActionButton`:

```tsx
import { ToolActionButton } from '@/components/common/ToolActionButton'

;<ToolActionButton toolId='my-tool' type='submit' disabled={!isValid}>
  Execute Tool
</ToolActionButton>
```

**Benefits:**

- ✅ Auto-disables when tool disabled in Contentful
- ✅ Shows custom disabled message
- ✅ Updates within 5 minutes (cache TTL)

---

## 📚 Reference Implementations

### Primary Reference: Token Creator

**Complete implementation with all best practices:**

- **Hook**: `src/hooks/solana/useTokenCreator.ts`
- **API Route**: `src/app/api/solana/token-creator/route.ts`
- **Server Utility**: `src/lib/solana/createTokenCreationTransaction.ts`
- **Form**: `src/components/pages/TokenCreatorPage/TokenForm/`

**Use Token Creator as template for:**

- IPFS integration
- Metadata handling
- Complex validation
- Multiple transaction instructions

### Secondary Reference: Burn Tokens

**Simpler implementation for basic tools:**

- **Hook**: `src/hooks/solana/useBurnTokens.ts`
- **API Route**: `src/app/api/solana/burn-tokens/route.ts`
- **Server Utility**: `src/lib/solana/burnToken.ts`
- **Form**: `src/components/pages/BurnTokensPage/BurnForm/`

**Use Burn Tokens as template for:**

- Simple token operations
- Basic validation
- Standard transaction flow

---

## 🎯 Tool IDs Reference

Use these exact `toolId` values:

| Tool                    | Tool ID                   |
| ----------------------- | ------------------------- |
| Token Creator           | `token-creator`           |
| Burn Tokens             | `burn-tokens`             |
| Create Liquidity        | `create-liquidity`        |
| Transaction Multisender | `transaction-multisender` |
| Revoke Mint Authority   | `revoke-mint-authority`   |
| Revoke Freeze Authority | `revoke-freeze-authority` |
| Freeze Accounts         | `freeze-accounts`         |
| Unfreeze Accounts       | `unfreeze-accounts`       |

---

## 📋 Implementation Checklist

### Architecture Compliance

- [ ] Client-side balance validation before API call
- [ ] API route follows standard pattern
- [ ] Server utility has `'server-only'` directive
- [ ] Private RPC used in server utility
- [ ] Public RPC used in hooks
- [ ] Service fee from tool config
- [ ] Service memo instruction added
- [ ] Type-safe API communication with `apiClient`

### Tool Configuration

- [ ] Tool config integration in hook with `useToolConfig`
- [ ] Service fee calculation from `getToolConfigFromCache`
- [ ] Config dependencies in `useCallback` array
- [ ] `ToolActionButton` used for submit
- [ ] Tool ID matches reference table

### Error Handling

- [ ] Use `SolanaError` with specific error codes
- [ ] `useToolBase` handles error processing
- [ ] User-friendly error messages
- [ ] Structured logging with context

### User Experience

- [ ] Loading states with toast
- [ ] Success feedback with transaction link
- [ ] Error feedback with actionable messages
- [ ] Mobile responsive design

### Testing

- [ ] Tested on devnet
- [ ] Different wallet types tested
- [ ] Error scenarios tested
- [ ] Edge cases covered

---

## 🚀 Next Steps

1. **Review Architecture**: Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Setup Environment**: Follow [DEVELOPMENT.md](./DEVELOPMENT.md)
3. **Study References**: Analyze Token Creator and Burn Tokens
4. **Start Building**: Use this guide as template
5. **Test Thoroughly**: Devnet first, then mainnet
6. **Document**: Update docs with any new patterns

---

**For error handling and debugging, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

**Built with ❤️ for the Solana ecosystem**
