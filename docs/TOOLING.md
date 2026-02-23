# CloakForge Tool Implementation Guide

## 5-Layer Architecture

All CloakForge tools follow this pattern:

```
1. Form Layer (Zod schema + React Hook Form)
   ↓
2. Page Component (form submission)
   ↓
3. Hook Layer (balance check → API call → sign → submit → confirm)
   ↓
4. API Route (validate → call server utility)
   ↓
5. Server Utility ('server-only' + private RPC → unsigned transaction)
```

## Quick Checklist

**Required files:**

```
src/
├── app/tools/{tool}/page.tsx                    # Route wrapper
├── app/api/solana/{tool}/route.ts               # API endpoint
├── components/pages/{Tool}Page/
│   ├── index.tsx                                # Page component
│   ├── {Tool}Form/
│   │   ├── index.tsx                            # Form
│   │   ├── schema.ts                            # Zod schema
│   │   └── FormSections.tsx                     # Form fields
│   └── FAQSection/                              # FAQs
├── hooks/solana/use{Tool}.ts                    # Main hook
├── lib/solana/server-side/create{Tool}Transaction.ts  #  Server utility
└── types/{tool}.ts                              # Types
```

**Before starting:**

- Check `src/components/common/` for reusable components
- Check `src/lib/solana/` for existing utilities
- Review Token Creator as reference implementation

## Layer 1: Zod Schema

**Location:** `src/components/pages/{Tool}Page/{Tool}Form/schema.ts`

```tsx
import { z } from 'zod'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

export const myToolSchema = z.object({
  walletAddress: solanaAddressSchema,
  amount: z.number().positive('Must be positive'),
})

export type MyToolFormData = z.infer<typeof myToolSchema>
```

## Layer 2: Page Component

**Location:** `src/components/pages/{Tool}Page/index.tsx`

```tsx
'use client'
import { useMyTool } from '@/hooks/solana/useMyTool'
import { MyToolForm } from './{Tool}Form'

export function MyToolPage() {
  const { execute, isExecuting } = useMyTool()

  return (
    <div className='container'>
      <MyToolForm onSubmit={execute} isLoading={isExecuting} />
    </div>
  )
}
```

**Form Component:** `src/components/pages/{Tool}Page/{Tool}Form/index.tsx`

```tsx
import { useForm } form 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { myToolSchema } from './schema'

export function MyToolForm({ onSubmit, isLoading }) {
  const form = useForm({
    resolver: zodResolver(myToolSchema),
    mode: 'onBlur',
  })

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

## Layer 3: Hook

**Location:** `src/hooks/solana/use{Tool}.ts`

```tsx
'use client'
import { useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { apiClient } from '@/lib/api/apiClient'
import { getLogger } from '@/lib/logger/logger'
import { toast } from '@/lib/toast/toast'

const logger = getLogger({ context: 'hooks:useMyTool' })

export function useMyTool() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [isExecuting, setIsExecuting] = useState(false)

  const execute = useCallback(
    async (data: MyToolFormData) => {
      if (!publicKey || !signTransaction) {
        toast.error('Connect wallet first')
        return
      }

      try {
        setIsExecuting(true)
        toast.loading('Preparing transaction...')

        // 1. Client balance check
        const balance = await connection.getBalance(publicKey)
        if (balance < estimatedCost) {
          throw new Error('Insufficient balance')
        }

        // 2. Call API
        const response = await apiClient.post('/api/solana/my-tool', data)
        const transaction = Transaction.from(Buffer.from(response.data.transaction, 'base64'))

        // 3. Sign
        const signed = await signTransaction(transaction)

        // 4. Submit
        const signature = await connection.sendRawTransaction(signed.serialize())

        // 5. Confirm
        await connection.confirmTransaction(signature, 'confirmed')

        toast.success('Success!', { description: signature })
        return signature
      } catch (error) {
        logger.error('Failed', { error })
        toast.error('Transaction failed')
        throw error
      } finally {
        setIsExecuting(false)
      }
    },
    [publicKey, signTransaction, connection]
  )

  return { execute, isExecuting }
}
```

## Layer 4: API Route

**Location:** `src/app/api/solana/{tool}/route.ts`

```tsx
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/config/serverConfig'
import { getLogger } from '@/lib/logger/logger'
import { myToolSchema } from '@/lib/schemas/{tool}'
import { createMyToolTransaction } from '@/lib/solana/server-side/create{Tool}Transaction'
import { AppError } from '@/lib/errors'

const logger = getLogger({ context: 'api:{tool}' })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = myToolSchema.parse(body)

    const { rpcPrivateEndpoint } = getServerConfig()
    const transaction = await createMyToolTransaction(validated, rpcPrivateEndpoint)

    return NextResponse.json({ transaction: transaction.toString('base64') })
  } catch (error) {
    logger.error('Failed', { error })
    const appError = AppError.from(error)
    return NextResponse.json({ error: appError.message }, { status: appError.statusCode })
  }
}
```

## Layer 5: Server Utility

**Location:** `src/lib/solana/server-side/create{Tool}Transaction.ts`

```tsx
import 'server-only'
import { Connection, Transaction, PublicKey } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'server:{tool}' })

export async function createMyToolTransaction(params: MyToolParams, rpcEndpoint: string): Promise<Buffer> {
  const connection = new Connection(rpcEndpoint, 'confirmed')

  const transaction = new Transaction()

  // Add instructions
  transaction.add(/* ... */)

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = new PublicKey(params.walletAddress)

  // Return serialized unsigned transaction
  return transaction.serialize({ requireAllSignatures: false })
}
```

## Tool Configuration Integration

**Optional:** For tools needing Contentful config:

```tsx
import { useToolConfig } from '@/hooks/queries/useToolConfig'

export function useMyTool() {
  const toolConfig = useToolConfig('my-tool') // Tool ID from Contentful

  const execute = useCallback(
    async (data) => {
      const serviceFee = toolConfig?.serviceFee ?? 0
      // Use serviceFee in transaction
    },
    [toolConfig]
  )

  return { execute, isExecuting }
}
```

## Tool ID Reference

| Tool                     | ID                        | Service Fee |
| ------------------------ | ------------------------- | ----------- |
| Token Creator            | `token-creator`           | 0.01 SOL    |
| Burn Tokens              | `burn-tokens`             | 0.005 SOL   |
| Freeze Wallets           | `freeze-wallets`          | 0.005 SOL   |
| Transaction Multi-Sender | `transaction-multisender` | Variable    |

## Common Patterns

**Check common components first:**

```tsx
import {
  InfoTooltip,
  ExplorerLink,
  WalletConnectionButton,
  FeeBreakdown,
  FileUpload,
  CustomFormField,
  LoadingSpinner,
} from '@/components/common'
```

**Use existing Solana utilities:**

```tsx
import { isValidSolanaAddress, lamportsToSol, validateWalletBalance, getTransactionFee } from '@/lib/solana'
```

**Error handling:**

```tsx
import { SolanaError, AppError } from '@/lib/errors'
import { handleError } from '@/lib/errors/handleError'

try {
  // Operation
} catch (error) {
  throw new SolanaError('Operation failed', 'OPERATION_FAILED', error)
}
```

## Implementation Checklist

**Before committing:**

- [ ] All 5 layers implemented
- [ ] `'server-only'` directive in server utility
- [ ] Private RPC used server-side (`rpcPrivateEndpoint`)
- [ ] Public RPC used client-side (wallet adapter connection)
- [ ] Client balance check before API call
- [ ] Zod validation in schema
- [ ] Logging with `getLogger()`
- [ ] Error handling with `AppError` / `SolanaError`
- [ ] Toast notifications (loading, success, error)
- [ ] Explorer link on success
- [ ] Mobile responsive
- [ ] Tested on devnet
- [ ] Zero ESLint warnings

## Reference Implementations

**Study these for best practices:**

- Token Creator: `src/hooks/solana/useTokenCreator.ts`
- Burn Tokens: `src/hooks/solana/useBurnTokens.ts`
- Transaction Multi-Sender: `src/hooks/solana/useTransactionMultisender.ts`

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Setup, standards
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Error handling
