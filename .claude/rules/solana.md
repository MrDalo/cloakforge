---
globs: src/lib/solana/**/*.ts, src/hooks/solana/**/*.ts
description: Solana development patterns — SPL tokens, transactions, wallet integration
---

## Key Rules

- **NEVER** use public RPC on server — always `rpcPrivateEndpoint`
- **NEVER** hold private keys on server
- **NEVER** store user data
- Use `LAMPORTS_PER_SOL` from `@solana/web3.js` for SOL conversions
- Use `isValidSolanaAddress` from `@/lib/solana` for address validation
- Import from `@/lib/solana` barrel (never individual files like `utils.ts`)
- Server-side files must have `'server-only'` directive

## Client-Side Flow (hooks)

1. Validate wallet connection
2. Validate SOL balance for fees
3. Call API route to get prepared transaction
4. Deserialize and sign with wallet adapter
5. Send transaction to network
6. Confirm and show explorer link

## Server-Side Flow (API + utilities)

1. Receive request, validate with Zod
2. Use `rpcPrivateEndpoint` from `getServerConfig()`
3. Build transaction with `@solana/web3.js`
4. Serialize without signatures
5. Return base64-encoded transaction

## Transaction Building

```typescript
const transaction = new Transaction()
transaction.add(instruction1, instruction2)
transaction.recentBlockhash = blockhash
transaction.feePayer = payerPublicKey
return transaction.serialize({ requireAllSignatures: false }).toString('base64')
```

## Error Handling

- `SolanaError` for blockchain-specific errors
- `AppError` for application-level errors
- `handleError()` for user-facing messages
- Always catch and log with `getLogger()`
