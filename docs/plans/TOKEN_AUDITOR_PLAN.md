# 🛡️ Token Auditor Tool - Implementation Plan

> **Comprehensive plan for building the Token Auditor tool in CloakForge**

## 📋 Executive Summary

The **Token Auditor** is a security analysis tool that generates a **Trust Score (0-100)** for any Solana token. It analyzes on-chain data to detect "rug pull" risks, including mint/freeze authorities, liquidity status, holder concentration, and Token-2022 extensions.

**Key Features:**
- 🔍 **Deep Security Scan**: Mint/Freeze authority, Metadata mutability, Token-2022 extensions.
- 📊 **Trust Score Engine**: Weighted algorithm to calculate a safety score.
- 💧 **Liquidity Analysis**: Checks if LP tokens are burned or locked.
- 👥 **Holder Analysis**: Detects whale concentration and "bundled" supply.
- ⚡ **Streaming UI**: Next.js 16 Server Components with Suspense for instant feedback.

---

## 🏗️ Architecture & Tech Stack

### Framework: Next.js 16 (App Router)
We will leverage **Server Components** and **Streaming** to provide a fast, responsive dashboard.

- **Server Components**: Fetch data directly from RPC nodes (no API routes needed for read-only data).
- **Suspense Boundaries**: Load independent sections (Security, Liquidity, Holders) in parallel.
- **Caching**: Use `unstable_cache` for expensive queries (e.g., holder snapshots) with short TTL (60s).

### Data Sources
1.  **Direct RPC (Helius/QuickNode)**:
    - `getAccountInfo`: Mint data, Metadata PDA.
    - `getTokenLargestAccounts`: Top holders.
    - `getProgramAccounts`: Finding Liquidity Pools (Raydium V4).
2.  **Metaplex SDK**: Decoding metadata.
3.  **Solana Web3.js**: Core blockchain interaction.

---

## 📂 File Structure

```
src/
├── app/
│   └── tools/
│       └── token-auditor/
│           ├── page.tsx                    # Input Form (Client Component)
│           └── [tokenAddress]/
│               ├── page.tsx                # Dashboard Shell (Server Component)
│               ├── loading.tsx             # Dashboard Skeleton
│               └── error.tsx               # Error Boundary
├── components/
│   └── pages/
│       └── TokenAuditorPage/
│           ├── TokenAuditForm/             # Input Component
│           └── TokenDashboard/
│               ├── index.tsx               # Dashboard Layout
│               ├── TrustScoreCard.tsx      # Main Score Visual
│               ├── SecurityAnalysis.tsx    # Authority Checks
│               ├── LiquidityAnalysis.tsx   # LP Status
│               ├── HolderAnalysis.tsx      # Distribution
│               └── TokenDetails.tsx        # Basic Info
└── lib/
    └── solana/
        └── token-auditor/
            ├── auditToken.ts               # Main Orchestrator
            ├── checkSecurity.ts            # Authority/Metadata Logic
            ├── checkLiquidity.ts           # Raydium/LP Logic
            └── checkHolders.ts             # Distribution Logic
```

---

## 🧠 Trust Score Algorithm

**Starting Score: 100**

| Risk Factor | Penalty | Condition |
| :--- | :--- | :--- |
| **Mint Authority Active** | **-100 (CRITICAL)** | `mintAuthority !== null` |
| **Freeze Authority Active** | **-100 (CRITICAL)** | `freezeAuthority !== null` |
| **LP Not Burned/Locked** | **-100 (CRITICAL)** | Creator holds > 5% of LP tokens |
| **Metadata Mutable** | **-20** | `isMutable === true` |
| **High Holder Concentration** | **-40** | Top 10 holders > 50% supply |
| **Medium Holder Concentration**| **-10** | Top 10 holders > 20% supply |
| **Transfer Fee Enabled** | **-10** | Token-2022 Transfer Fee > 0% |
| **Low Holder Count** | **-20** | < 50 Holders |

---

## 📝 Implementation Steps

### Phase 1: Core Logic & Utilities (`lib/solana/token-auditor/`)

1.  **`checkSecurity.ts`**:
    - Fetch Mint Account.
    - Check `mintAuthority` and `freezeAuthority`.
    - Fetch Metadata PDA (Metaplex) to check `isMutable`.
    - Check for Token-2022 extensions (Transfer Fee, Hooks).

2.  **`checkHolders.ts`**:
    - Use `connection.getTokenLargestAccounts(mint)`.
    - Calculate percentage held by top 10.
    - (Optional) Check if top holders are contracts (CEX/DeFi) vs Wallets.

3.  **`checkLiquidity.ts`**:
    - Derive Raydium V4 Pool Address (PDA using Program ID + Coin Mint + WSOL Mint).
    - Fetch Pool Account to get `lpMint` address.
    - Fetch `lpMint` supply and holders.
    - Check if top LP holders are "Dead" (`1111...`, `Dead...`) or known Lockers.

4.  **`auditToken.ts`**:
    - Orchestrate all checks in `Promise.all`.
    - Calculate final Trust Score.
    - Return comprehensive `AuditResult` object.

### Phase 2: UI Components (`components/pages/TokenAuditorPage/`)

1.  **`TokenAuditForm`**:
    - Simple input field for Token Address.
    - Zod validation for Solana address format.
    - Redirects to `/tools/token-auditor/[address]` on submit.

2.  **`TrustScoreCard`**:
    - Radial progress bar showing the score (0-100).
    - Color-coded (Green > 80, Yellow > 50, Red < 50).

3.  **Analysis Cards**:
    - **Security**: List of checks with ✅/❌ icons.
    - **Liquidity**: "Burned", "Locked", or "Unlocked" status.
    - **Holders**: Pie chart of distribution.

### Phase 3: Page Integration (`app/tools/token-auditor/`)

1.  **`[tokenAddress]/page.tsx`**:
    - Validate `tokenAddress` param.
    - Call `auditToken(address)` (Server-side).
    - Pass data to Client Components.
    - Use `Suspense` if we split the fetching (e.g., load basic info first, then heavy analysis).

---

## 🛡️ Security & Performance

- **Rate Limiting**: Cache audit results for 60 seconds to prevent RPC spam.
- **Error Handling**: Gracefully handle invalid mints or non-existent tokens.
- **Disclaimer**: Prominently display "DYOR" warning.

## 📅 Task List

- [ ] Create `lib/solana/token-auditor/` directory and utility files.
- [ ] Implement `checkSecurity` logic (Mint/Metadata).
- [ ] Implement `checkHolders` logic (RPC).
- [ ] Implement `checkLiquidity` logic (Raydium derivation).
- [ ] Create `auditToken` orchestrator.
- [ ] Build `TokenAuditForm` component.
- [ ] Build Dashboard UI components.
- [ ] Assemble `[tokenAddress]/page.tsx`.
- [ ] Add "Trust Score" calculation logic.
