# Platform Fee Implementation for Token Creator

## Overview

This document outlines the implementation of platform fee collection for the Token Creator tool, which allows the platform to collect service fees for token creation operations.

## Implementation Details

### 1. Enhanced Data Interface

- **File**: `src/lib/solana/tokenCreatorKit.ts`
- **Interface**: `EnhancedTokenCreatorFormData`
- **Purpose**: Extends the base `TokenCreatorFormData` with fee information

```typescript
export interface EnhancedTokenCreatorFormData extends TokenCreatorFormData {
  totalFeeLamports: number
  feeBreakdown: {
    name: string
    amount: number
    description?: string
  }[]
  payerPublicKey?: PublicKey
}
```

### 2. Fee Configuration

- **Config Source**: `config.feeWalletAddress` - destination wallet for platform fees
- **Fee Calculation**: Handled by `useFeeCalculation` hook using Contentful fee configuration
- **Fee Types**: Service fees, metadata fees, authority setup fees

### 3. Transaction Flow

The platform fee collection is integrated into the token creation transaction as follows:

1. **Compute Budget Instructions**: Set compute unit limits and prices for transaction reliability
2. **Platform Fee Transfer**: Transfer platform fee from user to platform wallet (if fee > 0)
3. **Token Creation**: Create mint account, initialize metadata, mint initial supply

### 4. Fee Transfer Implementation

- **Location**: Added in `createTokenWithSolanaKit` function after compute budget setup
- **Condition**: Only executes if `tokenData.totalFeeLamports > 0` and `feeWalletAddress` is configured
- **Instruction**: Uses `SystemProgram.transfer()` to transfer SOL from user to platform

```typescript
// Add platform fee transfer instruction before token creation
if (tokenData.totalFeeLamports > 0 && feeWalletAddress) {
  logger.info('Adding platform fee transfer instruction', {
    feeAmount: tokenData.totalFeeLamports,
    feeWalletAddress,
    fromWallet: walletPubkey.toString(),
  })

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPubkey,
      toPubkey: new PublicKey(feeWalletAddress),
      lamports: tokenData.totalFeeLamports,
    })
  )
}
```

### 5. Integration with Unified Architecture

- **Hook**: `useTokenCreatorUnified` automatically includes fee data when calling the kit
- **Enhanced Data**: Passes `totalFeeLamports` and `feeBreakdown` from fee calculation
- **Logging**: Platform fee transfers are logged for monitoring and debugging

### 6. Error Handling

- **Validation**: Fee wallet address and fee amount are validated before adding transfer instruction
- **Logging**: All fee transfers are logged with context including amounts and wallet addresses
- **Transaction Safety**: Fee transfer is added early in transaction to ensure payment before token creation

## Benefits

1. **Monetization**: Platform can collect fees for token creation services
2. **Transparency**: Users see exact fee breakdown before transaction
3. **Flexibility**: Fee amounts and structure configurable via Contentful
4. **Reliability**: Fee collection integrated into atomic transaction with token creation
5. **Monitoring**: All fee transfers are logged for business analytics

## Configuration Requirements

1. **Fee Wallet**: `config.feeWalletAddress` must be configured with a valid Solana wallet address
2. **Fee Structure**: Contentful must be configured with appropriate fee amounts for token creation
3. **Tool Config**: `enableFeeCharging` must be enabled in the tool configuration

## Security Considerations

- Fee transfer occurs before token creation to ensure payment
- Transaction is atomic - if token creation fails, fee transfer is also reverted
- Fee wallet address is validated and configurable through secure config system
- All fee transfers are logged for audit purposes
