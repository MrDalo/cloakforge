---
name: solana-patterns
description: 'SPL tokens, transaction building, authority management, wallet integration, error handling, and Solana development patterns for CloakForge. Use when working with blockchain logic, transactions, wallet features, token operations (create/mint/burn/freeze/transfer), authority revocation, multisender transactions, RPC connections, blockhash management, priority fees, transaction confirmation, or Solana-specific testing. Triggers on: writing server-side transaction utilities, client hooks for signing, API routes for Solana, token program interactions, compute budget instructions, or debugging Solana errors.'
---

# Solana Patterns

## Transaction Building (Server-Side)

Standard instruction order for all tools:
1. `addComputeBudgetInstructions(tx, units, priorityFee)` — compute budget + priority fee
2. `createServiceMemoInstruction(SERVICE_IDENTIFIERS.X)` — service memo (first, for visibility)
3. Unique nonce memo (prevent deduplication) — see references
4. `SystemProgram.transfer(...)` — service fee (if `totalServiceFeeSOL > 0`)
5. Core operation instruction (burn, revoke, freeze, etc.)

```typescript
import 'server-only'
import { Transaction, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js'
import { addComputeBudgetInstructions, calculateDynamicPriorityFee, createConnectionPair } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'

export async function createMyTransaction(params: MyParams) {
  const serverConfig = getServerConfig()
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)
  const logger = getLogger({ context: 'my-tool', function: 'createMyTransaction' })

  try {
    // Validate inputs, fetch on-chain state, check authorities
    const { blockhash } = await legacyConnection.getLatestBlockhash('confirmed')
    const dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger).catch(() => 1_000)

    const transaction = new Transaction()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = params.walletPublicKey

    addComputeBudgetInstructions(transaction, 100_000, dynamicPriorityFee)
    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.MY_TOOL))
    // ... add operation instruction

    transaction.serialize({ requireAllSignatures: false }) // validate size
    return { transaction }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare transaction')
  }
}
```

See `references/transaction-patterns.md` for: complete token operation examples, authority management patterns, blockhash refresh, and deduplication nonce.

## Client Hook Flow

```typescript
// Pattern from useBurnTokens / useRevokeMintAuthority
const executeTool = useCallback(async (context: ToolExecutionContext, params: MyParams) => {
  // 1. Client-side parameter validation
  // 2. validateBalance({ walletPublicKey, connection, serviceFee, networkFee })
  // 3. apiClient('/api/solana/my-tool', requestBody)
  // 4. Transaction.from(Buffer.from(response.serializedTransaction, 'base64'))
  // 5. Refresh blockhash: const { blockhash } = await connection.getLatestBlockhash('confirmed')
  // 6. context.signTransaction(transaction)
  // 7. connection.sendRawTransaction(signed.serialize(), { skipPreflight: false })
  // 8. confirmTransactionWithParallelStrategy(signature, priorityFee, kitRpc, connection, logger)
  // 9. showTransactionToast(result.signature, result.message)
}, [connection, config])

return useToolBase({ toolId: 'my-tool', toolName: 'My Tool', requiresWallet: true }, executeTool)
```

Key: always refresh the blockhash client-side after deserializing the server transaction — the server blockhash may be stale by signing time.

## API Route

Use `createSolanaApiRoute` factory (see `src/lib/api`):

```typescript
import 'server-only'
import { createSolanaApiRoute } from '@/lib/api'
import { myToolRequestSchema } from '@/lib/schemas/apiSchemas'

export const POST = createSolanaApiRoute({
  name: 'solana/my-tool',
  schema: myToolRequestSchema,
  additionalAddressFields: ['tokenAddress'],
  handler: async (data) => {
    const result = await createMyTransaction({ walletPublicKey: data.walletPublicKey, ... })
    return {
      serializedTransaction: Buffer.from(
        result.transaction.serialize({ requireAllSignatures: false })
      ).toString('base64'),
    }
  },
})
```

## Token Operations Quick Reference

| Operation | Instruction | Authority Required |
|-----------|------------|-------------------|
| Burn | `createBurnInstruction` | token account owner |
| Mint | `createMintToInstruction` | mint authority |
| Freeze | `createFreezeAccountInstruction` | freeze authority |
| Unfreeze | `createThawAccountInstruction` | freeze authority |
| Transfer | `createTransferInstruction` | source owner |
| Revoke mint | `createSetAuthorityInstruction(..., null)` | mint authority |
| Revoke freeze | `createSetAuthorityInstruction(..., null)` | freeze authority |

Always detect token program from `accountInfo.owner` — supports both `TOKEN_PROGRAM_ID` and `TOKEN_2022_PROGRAM_ID`.

## Error Codes

Use specific `AppError` codes so clients can display actionable messages:

| Code | When |
|------|------|
| `TOKEN_NOT_FOUND` | Mint or account doesn't exist |
| `TOKEN_ACCOUNT_NOT_FOUND` | Token account missing |
| `UNAUTHORIZED` | Wrong authority / frozen account |
| `INSUFFICIENT_FUNDS` | Not enough SOL |
| `INSUFFICIENT_TOKEN_BALANCE` | Not enough tokens |
| `INVALID_INPUT` | Bad address / wrong program |
| `BLOCKHASH_NOT_FOUND` | RPC blockhash call failed |
| `NETWORK_ERROR` | fetch/network failure |
| `RPC_CONNECTION_FAILED` | General RPC error |
| `TRANSACTION_FAILED` | Generic fallback |
| `FINALIZATION_TIMEOUT` | Confirmation timed out |

## Testing

See `references/testing-patterns.md` for: server utility test templates, hook test templates, API route test templates, and mock setups.

Key mocks required per layer:
- **Server utilities**: mock `getServerConfig`, `createConnectionPair`, `getCachedToolConfig`
- **Hooks**: mock `@solana/wallet-adapter-react`, `apiClient`, `confirmTransactionWithParallelStrategy`
- **API routes**: mock server utility, test Zod rejection (400) + happy path (200)
