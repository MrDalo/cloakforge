# 🌊 Create Liquidity Tool Implementation Plan

## 🎯 Objective
Build a professional-grade **Liquidity Pool Creator** for Solana using Raydium's SDK. This tool will allow users to launch new tokens by creating a liquidity pool (LP) with a base token (their token) and a quote token (usually SOL or USDC).

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Protocol**: Raydium SDK (Standard AMM V4) + OpenBook (Serum)
- **State Management**: Zustand (Wizard State)
- **Data Fetching**: React Query + Suspense
- **Styling**: Tailwind CSS + shadcn/ui

### The "Two-Step" Wizard Pattern
Creating a Raydium V4 pool is a complex, two-step process involving significant costs. We will implement a **Wizard UI** to guide users safely through this.

1.  **Step 1: Create OpenBook Market**
    *   **Why?** Raydium V4 pools *require* an OpenBook market ID to function.
    *   **Cost:** ~0.3 SOL (Optimized) to ~3 SOL (Standard).
    *   **Action:** Create a market on-chain.
2.  **Step 2: Initialize Liquidity Pool**
    *   **Why?** This actually creates the AMM pool and adds initial liquidity.
    *   **Cost:** ~0.4 SOL (Pool creation fee) + Liquidity Amount.
    *   **Action:** Create Raydium pool using the Market ID from Step 1.

---

## 🛠️ Implementation Details

### 1. Core Utilities (`src/lib/solana/raydium/`)

We need specialized utilities to handle the complex instruction building for Raydium and OpenBook.

#### `market.ts` (OpenBook Market Creation)
- **Function**: `createMarketTransaction`
- **Inputs**: Base Mint, Quote Mint, Lot Sizes (Tick Size, Min Order Size).
- **Logic**:
    - Calculate optimal lot sizes (critical for avoiding "price too small" errors).
    - Generate OpenBook market instructions.
    - Support "Low Cost" mode by adjusting event queue length.

#### `pool.ts` (Raydium Pool Creation)
- **Function**: `createPoolTransaction`
- **Inputs**: Market ID, Base Amount, Quote Amount, Launch Date.
- **Logic**:
    - Fetch market info to validate.
    - Generate `Liquidity.makeCreatePoolV4InstructionV2Simple` instructions.
    - Handle associated token account creation if needed.

### 2. API Routes (`src/app/api/solana/`)

We will use **API Routes** instead of Server Actions for transaction building to ensure clean serialization of the unsigned transaction object and better error handling.

- **`POST /api/solana/create-market`**:
    - Validates inputs (Zod).
    - Calls `createMarketTransaction`.
    - Returns serialized transaction + estimated fee.
- **`POST /api/solana/create-pool`**:
    - Validates inputs (Zod).
    - Calls `createPoolTransaction`.
    - Returns serialized transaction.

### 3. UI Components (`src/components/pages/CreateLiquidityPage/`)

#### `LiquidityWizard.tsx`
- Main container managing the steps.
- Uses `useLiquidityStore` (Zod) to persist state between steps.

#### `Step1MarketForm.tsx`
- Inputs: Token Address, Quote Token (SOL/USDC), Advanced Options (Lot sizes).
- Features:
    - "Optimize for Low Cost" toggle (Default: On).
    - Real-time cost estimation.

#### `Step2PoolForm.tsx`
- Inputs: Market ID (Auto-filled from Step 1), Base Amount, Quote Amount, Start Time.
- Features:
    - Price calculation (Base/Quote ratio).
    - "Sniper Protection" info (optional future feature).

---

## 🧩 Next.js 16 Features Integration

### 1. Partial Prerendering (PPR)
- The **Wizard Shell** (Steps, FAQ, Benefits) will be statically prerendered.
- The **Forms** and **Dynamic Data** (Balances, Prices) will be wrapped in `<Suspense>` boundaries.

### 2. Server-Side Validation
- All inputs validated on server using Zod schemas before touching the SDK.

### 3. Cache Components (`use cache`)
- We will cache token metadata and common market configurations to speed up the UI.

---

## 📝 Step-by-Step Execution Plan

### Phase 1: Foundation & Market Creation
1.  **Install Dependencies**: `@raydium-io/raydium-sdk`, `@project-serum/serum`.
2.  **Create Schemas**: Zod schemas for Market and Pool forms.
3.  **Implement `market.ts`**: Logic to build OpenBook market transactions.
4.  **Create API Route**: `/api/solana/create-market`.
5.  **Build UI Step 1**: Market creation form with cost estimator.

### Phase 2: Pool Initialization
1.  ✅ **Implement `pool.ts`**: Logic to build Raydium pool transactions.
2.  ✅ **Create API Route**: `/api/solana/create-pool`.
3.  ✅ **Build UI Step 2**: Pool initialization form with price inputs.
4.  ✅ **Connect Wizard**: Link Step 1 and Step 2.

### Phase 3: Polish & Safety
1.  **Error Handling**: specific error messages for common Raydium errors (e.g., "Lot size invalid").
2.  **Success States**: Confetti and "View Pool" links.
3.  **Devnet Testing**: Rigorous testing on Devnet (Raydium Devnet is tricky, may need specific addresses).

---

## ⚠️ Critical Considerations

### 1. The "Rent" Problem
Creating an OpenBook market is expensive (Solana Rent).
- **Standard**: ~2.8 SOL
- **Optimized**: ~0.3 SOL (We MUST implement this to be competitive).
- **How**: Reduce `eventQueueLength`, `requestQueueLength`, and `orderbookLength`.

### 2. Lot Size Calculation
One of the hardest parts of Raydium.
- If `Tick Size` is too small/large relative to `Min Order Size`, the pool fails.
- We need a helper utility to calculate "Safe Defaults" based on token decimals.

### 3. OpenBook Program ID
- Mainnet: `srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX`
- Devnet: `EoTcMgcDRTJVZDMZWBoU6trXLbE6hvVR1J0rv7Rakhb` (May vary).

---

## 📚 Reference Links
- [Raydium SDK V1 Demo](https://github.com/raydium-io/raydium-sdk-V1-demo)
- [OpenBook Market Calculator](https://openbook-tools.dexlab.space/market/create)
