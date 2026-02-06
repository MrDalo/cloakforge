# Solana Patterns Skill

This skill provides Solana-specific development patterns for CloakForge's SPL token management tools.

## When to Use

Use this skill when building Solana transaction logic, working with SPL tokens, wallet integration, or debugging blockchain interactions.

## Hybrid Client/Server Model

CloakForge uses a hybrid architecture:
- **Client** (browser): Wallet connection, transaction signing, balance display
- **Server** (Node.js): Transaction preparation, validation, private RPC access

```
User Action → Client Hook → API Route → Server Utility → Return Unsigned TX → Client Signs → Submit
```

### Why Hybrid?
- Server uses private RPC (no rate limits, faster)
- Client signs transactions (keys never leave wallet)
- Server validates before building transactions (security)
- Server adds service fees (revenue model)

## Transaction Building Pattern

### Server-Side (src/lib/solana/server-side/)

```typescript
'server-only';

import { Connection, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { getServerConfig } from '@/lib/config/serverConfig';
import { serviceMemo } from '@/lib/solana/serviceMemo';

export const createMyToolTransaction = async (params: MyToolParams) => {
  const { rpcPrivateEndpoint, serviceFeeWallet } = getServerConfig();
  const connection = new Connection(rpcPrivateEndpoint);
  
  const transaction = new Transaction();
  
  // 1. Service memo FIRST (always)
  transaction.add(serviceMemo('my-tool'));
  
  // 2. Fee transfer SECOND
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(params.payerAddress),
      toPubkey: new PublicKey(serviceFeeWallet),
      lamports: feeAmount,
    })
  );
  
  // 3. Tool-specific instructions
  transaction.add(/* tool instructions */);
  
  // 4. Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = new PublicKey(params.payerAddress);
  
  // 5. Return serialized unsigned transaction
  return transaction.serialize({ requireAllSignatures: false }).toString('base64');
};
```

### Instruction Order (CRITICAL)
1. **Service memo** — identifies the tool used (for analytics)
2. **Fee transfer** — service fee to platform wallet
3. **Tool instructions** — the actual operation (mint, burn, transfer, etc.)

## SPL Token Operations

### Token Creation
- Create mint account with specified decimals
- Create metadata account (Metaplex Token Metadata)
- Set mint/freeze authorities
- Upload metadata to IPFS (Pinata) first

### Token Burning
- Verify token account ownership
- Check balance sufficient for burn amount
- Create burn instruction
- Optionally close token account if fully burned

### Authority Management
- Revoke mint authority → prevents new token minting
- Revoke freeze authority → prevents account freezing
- These are irreversible operations — require confirmation UI

### Multi-Sender (Batch Transfers)
- Up to 500 recipients per batch
- Split into multiple transactions if needed
- Each transaction has max instruction limit
- Track success/failure per recipient

## Wallet Integration

### Wallet Adapter Pattern
```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';

const { publicKey, signTransaction, connected } = useWallet();
const { connection } = useConnection();
```

### Provider Hierarchy
```
AppProvider
  → ConfigProvider (env vars)
    → SolanaProvider (wallet adapter, connection)
      → QueryProvider (TanStack Query)
        → ToolConfigProvider (Contentful tool configs)
```

### Address Validation
```typescript
import { isValidSolanaAddress } from '@/lib/solana';

// Always validate before using in transactions
if (!isValidSolanaAddress(address)) {
  throw new AppError('Invalid Solana address');
}
```

## Hook Pattern (Client-Side)

```typescript
// src/hooks/solana/useMyTool.ts
import { useToolBase } from '@/hooks/solana/useToolBase';

export const useMyTool = () => {
  return useToolBase({
    toolName: 'my-tool',
    mutationFn: async (params) => {
      // 1. Validate balance (client-side)
      // 2. Call API route
      // 3. Deserialize transaction
      // 4. Sign with wallet
      // 5. Send to network
      // 6. Confirm transaction
    },
  });
};
```

## API Route Pattern

```typescript
// src/app/api/solana/my-tool/route.ts
import { NextResponse } from 'next/server';
import { myToolSchema } from '@/lib/schemas/myTool';
import { createMyToolTransaction } from '@/lib/solana/server-side/createMyToolTransaction';

export const POST = async (request: Request) => {
  const body = await request.json();
  
  // 1. Validate with Zod
  const parsed = myToolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 'error', status_code: 400, error_message: 'Validation failed' },
      { status: 400 }
    );
  }
  
  // 2. Call server utility
  const transaction = await createMyToolTransaction(parsed.data);
  
  // 3. Return transaction
  return NextResponse.json(
    { status: 'success', status_code: 200, data: { transaction } }
  );
};
```

## Common Solana Errors

| Error | Cause | Handling |
|-------|-------|----------|
| `Blockhash not found` | Transaction too old | Retry with fresh blockhash |
| `Insufficient funds` | Not enough SOL | Pre-check balance before building TX |
| `Transaction simulation failed` | Invalid instructions | Simulate before submitting |
| `Account not found` | Invalid address or no token account | Validate address and check account exists |
| `Owner mismatch` | Wrong authority | Verify ownership before authority operations |
| `Rate limited` | Too many RPC calls | Use private RPC on server, throttle client |

## Key Utilities (import from `@/lib/solana`)

- `isValidSolanaAddress(address)` — validate Solana address
- `validateBalance(connection, publicKey, requiredAmount)` — check SOL balance
- `getWalletTokens(connection, publicKey)` — get token accounts
- `getTokenMetadata(connection, mintAddress)` — fetch token metadata
- `serviceMemo(toolId)` — create service memo instruction

## Security Checklist

- [ ] Server uses private RPC only (`getServerConfig().rpcPrivateEndpoint`)
- [ ] Client signs transactions (keys never leave wallet)
- [ ] Balance pre-checked before transaction building
- [ ] Ownership validated for authority operations
- [ ] Transaction simulated before submission
- [ ] No user data stored (privacy-first)
- [ ] All addresses validated with `isValidSolanaAddress`
- [ ] Service memo and fee in correct instruction order
