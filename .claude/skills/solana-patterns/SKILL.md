---
name: solana-patterns
description: 'SPL tokens, transaction building, wallet integration, and Solana development patterns for CloakForge. Use when working with blockchain logic, transactions, or wallet features.'
---

# Solana Patterns Skill

## Hybrid Client/Server Model

### Client Side (hooks)

1. Validate wallet connection
2. Validate SOL balance for fees
3. Call API route to get prepared transaction
4. Deserialize and sign with wallet adapter
5. Send transaction to network
6. Confirm and show explorer link

### Server Side (API + utilities)

1. Receive request, validate with Zod
2. Use `rpcPrivateEndpoint` from `getServerConfig()`
3. Build transaction with `@solana/web3.js`
4. Serialize without signatures
5. Return base64-encoded transaction

## Key Rules

- **NEVER** use public RPC on server — always `rpcPrivateEndpoint`
- **NEVER** hold private keys on server
- **NEVER** store user data
- Use `LAMPORTS_PER_SOL` for SOL conversions
- Use `isValidSolanaAddress` from `@/lib/solana`
- Import from `@/lib/solana` barrel (never individual files)
- Server files must have `'server-only'` directive

## Transaction Patterns

### Token Operations

- Create token: `createMint` + metadata
- Mint tokens: `mintTo` instruction
- Burn tokens: `burn` instruction
- Transfer: `transfer` instruction
- Freeze/unfreeze: `freezeAccount` / `thawAccount`
- Authority: `setAuthority` instruction

### Transaction Building

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

## Testing

- Mock RPC responses for unit tests
- Mock wallet adapter for hook tests
- Test transaction serialization/deserialization
- Verify instruction data and accounts
