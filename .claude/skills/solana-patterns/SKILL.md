---
name: solana-patterns
description: 'SPL tokens, transaction building, wallet integration, and Solana development patterns for CloakForge. Use when working with blockchain logic, transactions, or wallet features.'
---

# Solana Patterns

## Token Operations

- Create: `createMint` + metadata
- Mint: `mintTo` instruction
- Burn: `burn` instruction
- Transfer: `transfer` instruction
- Freeze/Unfreeze: `freezeAccount` / `thawAccount`
- Authority: `setAuthority` instruction

## Transaction Building

```typescript
const transaction = new Transaction()
transaction.add(instruction1, instruction2)
transaction.recentBlockhash = blockhash
transaction.feePayer = payerPublicKey
return transaction.serialize({ requireAllSignatures: false }).toString('base64')
```

## Client Hook Flow

1. Validate wallet connection + SOL balance
2. Call API route for prepared transaction
3. Deserialize and sign with wallet adapter
4. Send to network
5. Confirm and show `ExplorerLink`

## Testing Solana Code

- Mock RPC responses for unit tests
- Mock wallet adapter for hook tests
- Mock `getServerConfig()` for server utilities
- Test transaction serialization/deserialization
- Verify instruction data and accounts
