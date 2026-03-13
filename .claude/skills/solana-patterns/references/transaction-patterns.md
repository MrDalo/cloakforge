# Transaction Patterns — Reference

## Contents
1. [Complete Token Operation Examples](#1-complete-token-operation-examples)
2. [Authority Management](#2-authority-management)
3. [Deduplication Nonce](#3-deduplication-nonce)
4. [Dynamic Priority Fee](#4-dynamic-priority-fee)
5. [Blockhash Refresh (Client)](#5-blockhash-refresh-client)
6. [Token Program Detection](#6-token-program-detection)
7. [SOL Balance Validation](#7-sol-balance-validation)

---

## 1. Complete Token Operation Examples

### Burn Tokens
```typescript
const burnInstruction = createBurnInstruction(
  tokenAccountPubkey, // token account
  mintPubkey,         // mint
  walletPublicKey,    // owner
  rawAmount,          // BigInt(Math.floor(amount * 10 ** decimals))
  [],                 // multiSigners — empty for single-sig
  detectedTokenProgram
)
transaction.add(burnInstruction)
```

### Mint Tokens
```typescript
import { createMintToInstruction } from '@solana/spl-token'

const mintInstruction = createMintToInstruction(
  mintPubkey,           // mint
  destinationAccount,   // destination token account
  mintAuthorityPubkey,  // mint authority
  rawAmount,            // BigInt
  [],
  tokenProgramId
)
```

### Freeze / Unfreeze Account
```typescript
import { createFreezeAccountInstruction, createThawAccountInstruction } from '@solana/spl-token'

// Freeze
const freezeIx = createFreezeAccountInstruction(
  tokenAccountPubkey,
  mintPubkey,
  freezeAuthorityPubkey,
  [],
  tokenProgramId
)

// Unfreeze
const thawIx = createThawAccountInstruction(
  tokenAccountPubkey,
  mintPubkey,
  freezeAuthorityPubkey,
  [],
  tokenProgramId
)
```

### Transfer SPL Tokens
```typescript
import { createTransferInstruction } from '@solana/spl-token'

const transferIx = createTransferInstruction(
  sourceTokenAccount,
  destinationTokenAccount,
  ownerPublicKey,
  rawAmount,
  [],
  tokenProgramId
)
```

---

## 2. Authority Management

### Revoke Mint Authority
```typescript
import { createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token'

transaction.add(
  createSetAuthorityInstruction(
    mintPubkey,          // mint address
    walletPublicKey,     // current authority
    AuthorityType.MintTokens,
    null,                // null = revoke (no new authority)
    [],
    tokenProgramId
  )
)
```

### Revoke Freeze Authority
```typescript
transaction.add(
  createSetAuthorityInstruction(
    mintPubkey,
    walletPublicKey,
    AuthorityType.FreezeAccount,
    null,
    [],
    tokenProgramId
  )
)
```

### Transfer Authority to New Wallet
```typescript
transaction.add(
  createSetAuthorityInstruction(
    mintPubkey,
    currentAuthorityPubkey,
    AuthorityType.MintTokens,
    newAuthorityPubkey,  // new authority (not null)
    [],
    tokenProgramId
  )
)
```

### Validate Authority Before Transaction
```typescript
const mintInfo = await getMint(connection, mintPubkey, 'confirmed', tokenProgramId)

if (!mintInfo.mintAuthority) {
  throw new AppError('UNAUTHORIZED', 'Mint authority already revoked')
}
if (!mintInfo.mintAuthority.equals(walletPublicKey)) {
  throw new AppError('UNAUTHORIZED', 'You are not the mint authority')
}
```

---

## 3. Deduplication Nonce

Solana deduplicates transactions with identical content + blockhash. Add a unique nonce memo to prevent this when users submit the same operation twice.

```typescript
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
const randomBytes = crypto.getRandomValues(new Uint8Array(8))
const uniqueNonce = Buffer.from(randomBytes).toString('base64')

transaction.add(new TransactionInstruction({
  keys: [],
  programId: MEMO_PROGRAM_ID,
  data: Buffer.from(`${toolName}:${uniqueNonce}`, 'utf-8'),
}))
```

---

## 4. Dynamic Priority Fee

Always use dynamic fees with a static fallback:

```typescript
let dynamicPriorityFee: number
try {
  dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
} catch {
  logger.warn('Dynamic priority fee failed, using fallback', { fallbackFee: 1_000 })
  dynamicPriorityFee = 1_000 // microlamports
}

// Apply to transaction (must be first instructions)
addComputeBudgetInstructions(transaction, 100_000, dynamicPriorityFee)
// 100k units: simple op; 200k units: complex ops (token creation, multisender)
```

---

## 5. Blockhash Refresh (Client)

The server-set blockhash may expire between preparation and signing. Always refresh client-side:

```typescript
// After: Transaction.from(Buffer.from(response.serializedTransaction, 'base64'))
const { blockhash } = await connection.getLatestBlockhash('confirmed')
transaction.recentBlockhash = blockhash
```

---

## 6. Token Program Detection

Never hardcode `TOKEN_PROGRAM_ID` — detect from `accountInfo.owner`:

```typescript
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

const accountInfo = await connection.getAccountInfo(tokenPubkey, 'confirmed')
if (!accountInfo) throw new AppError('TOKEN_NOT_FOUND', 'Token not found')

let tokenProgramId: PublicKey
if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
  tokenProgramId = TOKEN_PROGRAM_ID
} else if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
  tokenProgramId = TOKEN_2022_PROGRAM_ID
} else {
  throw new AppError('INVALID_INPUT', `Unknown token program: ${accountInfo.owner}`)
}

// Then fetch mint with correct program ID
const mintInfo = await getMint(connection, mintPubkey, 'confirmed', tokenProgramId)
```

---

## 7. SOL Balance Validation

### Server-Side Check
```typescript
const balanceLamports = await connection.getBalance(walletPublicKey)
const walletBalance = lamportsToSol(balanceLamports)
const estimatedCost = 0.0001 + totalServiceFeeSOL

if (walletBalance < estimatedCost) {
  throw new AppError(
    'INSUFFICIENT_FUNDS',
    `Need ${estimatedCost.toFixed(4)} SOL, have ${walletBalance.toFixed(4)} SOL`
  )
}
```

### Client-Side Check (Hook)
```typescript
const balanceValidation = await validateBalance({
  walletPublicKey: new PublicKey(context.walletAddress),
  connection,
  serviceId: 'my-tool',
  formData: {},
  serviceFee: config?.baseFee ?? 0.01,
  networkFee: config?.networkFee ?? 0.0005,
})

if (!balanceValidation.hasSufficientBalance) {
  throw new AppError('INSUFFICIENT_FUNDS', `Need ${balanceValidation.estimatedCost.toFixed(4)} SOL`)
}
```
