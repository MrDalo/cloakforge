# Generic Balance Validation Utility

This document describes the generic `validateBalance` utility that provides fast client-side balance validation for any CloakForge tool before making API calls.

## Overview

The `validateBalance` utility in `/src/lib/solana/validateBalance.ts` is a generic solution for validating wallet balance against estimated transaction costs. It combines:

- Base service fees from Contentful tool configuration (`getToolConfigFromCache`)
- Conditional fees from tool fee configurations (`toolFeeConfigs`)
- Network fees (transaction costs and rent exemption)

## Features

- **Generic Design**: Works with any tool by accepting a `serviceId` parameter
- **Comprehensive Fee Calculation**: Includes base fees, conditional fees, and network costs
- **Fast Client-Side Validation**: Uses public RPC connection for quick balance checks
- **Detailed Fee Breakdown**: Returns breakdown of all fee components for debugging
- **Backward Compatibility**: Includes `validateTokenCreationBalance` helper for existing code

## Usage

### Basic Generic Usage

```typescript
import { validateBalance } from '@/lib/solana/validateBalance'

const balanceResult = await validateBalance({
  walletPublicKey: new PublicKey(walletAddress),
  connection: publicConnection,
  serviceId: 'token-creator',
  formData: {
    revokeMintAuthority: true,
    revokeFreezeAuthority: false,
    // ... other form fields that may trigger fees
  },
})

if (!balanceResult.hasSufficientBalance) {
  throw new Error(`Insufficient funds: need ${balanceResult.estimatedCost} SOL`)
}
```

### Token Creation Specific Helper

```typescript
import { validateTokenCreationBalance } from '@/lib/solana/validateBalance'

const balanceResult = await validateTokenCreationBalance({
  walletPublicKey: new PublicKey(walletAddress),
  connection: publicConnection,
  revokeMintAuthority: true,
  revokeFreezeAuthority: false,
})
```

## Fee Structure

The utility calculates fees in this order:

1. **Base Fee**: Retrieved from `getToolConfigFromCache(serviceId).baseFee`
2. **Conditional Fees**: Applied based on `formData` values matching `toolFeeConfigs[serviceId]()` field names
3. **Network Fee**: Transaction costs + rent exemption (for token operations)

### Example Fee Breakdown

```typescript
{
  currentBalance: 1.5,
  estimatedCost: 0.015,
  serviceFee: 0.01, // baseFee + conditional fees
  networkFee: 0.005, // transaction + rent
  hasSufficientBalance: true,
  feeBreakdown: {
    baseFee: 0.005, // From tool config
    conditionalFees: [
      { fieldName: 'revokeMintAuthority', fee: 0.005 }
    ],
    networkFee: 0.005
  }
}
```

## Parameters

### GenericBalanceParams

```typescript
interface GenericBalanceParams {
  walletPublicKey: PublicKey // User's wallet
  connection: Connection // Public RPC connection
  serviceId: string // Tool identifier (e.g., 'token-creator')
  formData: Record<string, boolean | string | number | undefined> // Form values
  estimatedNetworkFee?: number // Optional network fee override
}
```

### GenericBalanceResult

```typescript
interface GenericBalanceResult {
  currentBalance: number // Wallet balance in SOL
  estimatedCost: number // Total estimated cost in SOL
  serviceFee: number // Total service fees in SOL
  networkFee: number // Network costs in SOL
  hasSufficientBalance: boolean // Whether balance is sufficient
  feeBreakdown: {
    baseFee: number
    conditionalFees: Array<{ fieldName: string; fee: number }>
    networkFee: number
  }
}
```

## Implementation Details

### Service ID Mapping

The `serviceId` parameter maps to:

- `toolFeeConfigs[serviceId]()` for conditional fees
- `getToolConfigFromCache(serviceId)` for base fees

Supported service IDs:

- `'token-creator'`
- `'burn-tokens'`
- `'freeze-accounts'`
- `'transaction-multisender'`
- And any other tool with corresponding configurations

### Network Fee Estimation

The utility automatically detects token-related operations and includes rent exemption costs:

```typescript
// For token operations, adds rent exemption
if (serviceId === 'token-creator' || serviceId.includes('token')) {
  const rentExemptBalance = await getMinimumBalanceForRentExemptMint(connection)
  networkFee += rentExemptBalance / LAMPORTS_PER_SOL
}
```

### Error Handling

- Graceful degradation: If tool config fetch fails, uses zero base fee
- Logging: All fee calculations and errors are logged with context
- Type Safety: Strict TypeScript types prevent common errors

## Integration with createTokenCreationTransaction

The server-side transaction creation now includes both base and conditional fees:

```typescript
// Calculate service fees based on selected options
let totalServiceFeeSOL = 0

// Get base service fee from tool configuration
const toolConfig = await getToolConfigFromCache('token-creator')
if (toolConfig) {
  totalServiceFeeSOL += toolConfig.baseFee
}

// Apply conditional fees from toolFeeConfigs
const toolFees = toolFeeConfigs['token-creator']()
for (const feeConfig of toolFees) {
  if (feeConfig.fieldName === 'revokeMintAuthority' && tokenData.revokeMintAuthority) {
    totalServiceFeeSOL += feeConfig.fee
  }
  // ... other conditional fees
}
```

## Migration Guide

### For Existing Token Creator Usage

No changes needed - the `validateTokenCreationBalance` helper maintains backward compatibility:

```typescript
// This still works exactly as before
const result = await validateTokenCreationBalance({
  walletPublicKey,
  connection,
  revokeMintAuthority: true,
  revokeFreezeAuthority: false,
})
```

### For New Tool Development

Use the generic `validateBalance` for new tools:

```typescript
const result = await validateBalance({
  walletPublicKey,
  connection,
  serviceId: 'your-tool-id',
  formData: {
    // Any form fields that may trigger fees
    enableFeatureA: true,
    enableFeatureB: false,
  },
})
```

## Best Practices

1. **Always validate on client-side first** for fast user feedback
2. **Use public RPC connection** for balance checks to avoid rate limiting private endpoints
3. **Include small buffer** - utility adds 0.001 SOL buffer for precision
4. **Log validation results** for debugging fee calculation issues
5. **Handle errors gracefully** - utility falls back to safe defaults

## Testing

Test the utility with different scenarios:

```typescript
// Test insufficient funds
await validateBalance({
  walletPublicKey: lowBalanceWallet,
  connection,
  serviceId: 'token-creator',
  formData: { revokeMintAuthority: true },
})

// Test with no conditional fees
await validateBalance({
  walletPublicKey: wallet,
  connection,
  serviceId: 'token-creator',
  formData: {},
})

// Test with all conditional fees
await validateBalance({
  walletPublicKey: wallet,
  connection,
  serviceId: 'token-creator',
  formData: {
    revokeMintAuthority: true,
    revokeFreezeAuthority: true,
  },
})
```
