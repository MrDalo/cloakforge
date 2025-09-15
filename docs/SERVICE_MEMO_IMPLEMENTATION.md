# Service Memo Implementation Guide

## Overview

This guide explains how to add service identification memos to all CloakForge transactions for on-chain usage tracking. Since CloakForge is privacy-first with no analytics, these memos provide visibility into which services are being used by querying the blockchain.

## How It Works

- Each service transaction includes a memo instruction with a service identifier
- Memos are stored permanently on the blockchain and can be queried
- No user data is collected - only service usage is tracked
- Completely transparent and verifiable on-chain

## Implementation

### 1. Import Service Memo Utilities

```typescript
import { addServiceMemo, SERVICE_IDENTIFIERS } from '@/lib/solana/serviceMemo'
```

### 2. Add Memo to Service Fee Transactions

```typescript
// After adding your service fee transfer
if (totalServiceFee > 0 && feeWalletAddress) {
  // Add service fee transfer
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPubkey,
      toPubkey: new PublicKey(feeWalletAddress),
      lamports: serviceFeeLamports,
    })
  )

  // Add service identification memo
  addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_CREATOR, `fee:${totalServiceFee}SOL`)
}
```

### 3. Service Identifiers Available

- `SERVICE_IDENTIFIERS.TOKEN_CREATOR` → `'token-creator-service'`
- `SERVICE_IDENTIFIERS.TOKEN_BURNER` → `'burn-tokens-service'`
- `SERVICE_IDENTIFIERS.FREEZE_ACCOUNTS` → `'freeze-accounts-service'`
- `SERVICE_IDENTIFIERS.UNFREEZE_ACCOUNTS` → `'unfreeze-accounts-service'`
- `SERVICE_IDENTIFIERS.AUTHORITY_MANAGEMENT` → `'authority-management-service'`
- `SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER` → `'transaction-multisender-service'`
- `SERVICE_IDENTIFIERS.CREATE_LIQUIDITY` → `'create-liquidity-service'`
- `SERVICE_IDENTIFIERS.PORTFOLIO_TRACKER` → `'portfolio-tracker-service'`

## Example Implementations

### Token Burner Service

```typescript
// In burnTokens function
if (totalServiceFee > 0 && feeWalletAddress) {
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPubkey,
      toPubkey: new PublicKey(feeWalletAddress),
      lamports: serviceFeeLamports,
    })
  )

  addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_BURNER, `tokens:${tokensCount}`)
}
```

### Transaction Multisender Service

```typescript
// In multisender function
if (totalServiceFee > 0 && feeWalletAddress) {
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPubkey,
      toPubkey: new PublicKey(feeWalletAddress),
      lamports: serviceFeeLamports,
    })
  )

  addServiceMemo(transaction, SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER, `recipients:${recipientCount}`)
}
```

### Authority Management Service

```typescript
// In authority revocation functions
if (totalServiceFee > 0 && feeWalletAddress) {
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPubkey,
      toPubkey: new PublicKey(feeWalletAddress),
      lamports: serviceFeeLamports,
    })
  )

  addServiceMemo(transaction, SERVICE_IDENTIFIERS.AUTHORITY_MANAGEMENT, `action:revoke_mint`)
}
```

## Querying Usage Data

You can query blockchain data to get service usage statistics:

### Using Solana CLI

```bash
# Get all transactions for your fee wallet
solana transaction-history <FEE_WALLET_ADDRESS> --limit 1000

# Search for specific service in transaction logs
solana transaction <SIGNATURE> | grep "token-creator-service"
```

### Using RPC Calls

```typescript
// Get transactions for fee wallet
const signatures = await connection.getSignaturesForAddress(feeWalletPubkey, {
  limit: 1000
})

// Analyze each transaction for memos
for (const sig of signatures) {
  const transaction = await connection.getTransaction(sig.signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0
  })

  // Check for memo instructions in logs
  if (transaction?.meta?.logMessages) {
    const memoLogs = transaction.meta.logMessages.filter(log =>
      log.includes('token-creator-service') ||
      log.includes('burn-tokens-service') ||
      // ... other service identifiers
    )

    // Process memo data
    console.log('Service usage found:', memoLogs)
  }
}
```

## Benefits

1. **Privacy-Preserving**: No user data collected, only service usage
2. **Transparent**: All data is publicly verifiable on blockchain
3. **Permanent**: Usage data cannot be deleted or modified
4. **Cost-Effective**: Memo instructions add minimal transaction cost
5. **Queryable**: Can generate detailed usage reports from blockchain data

## Files to Update

To implement across all services, update these files:

- `src/lib/solana/burnTokens.ts` - Add TOKEN_BURNER memo
- `src/lib/solana/freezeAccounts.ts` - Add FREEZE_ACCOUNTS memo
- `src/lib/solana/unfreezeAccounts.ts` - Add UNFREEZE_ACCOUNTS memo
- `src/lib/solana/revokeAuthority.ts` - Add AUTHORITY_MANAGEMENT memo
- `src/lib/solana/multisender.ts` - Add TRANSACTION_MULTISENDER memo
- `src/lib/solana/createLiquidity.ts` - Add CREATE_LIQUIDITY memo

## Testing

Test memo functionality:

1. Execute a service transaction on devnet
2. Check transaction on Solana Explorer
3. Verify memo appears in transaction logs
4. Query transaction programmatically to extract memo data
