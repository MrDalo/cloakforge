# 🚀 CloakForge Optimization Plan

> **Strategic plan to modernize codebase with Next.js 16 features and enforce DRY principles**

**Date:** November 21, 2025
**Status:** Draft

## 📋 Executive Summary

Following a comprehensive code audit, this plan outlines specific actions to:

1.  **Eliminate Code Duplication** in UI components (specifically Hero sections).
2.  **Leverage React 19 Features** by removing manual memoization in favor of React Compiler.
3.  **Standardize Architecture** by enforcing common component usage.

---

## Phase 1: DRY Refactoring (Hero Sections) - **COMPLETED**

**Goal:** Reduce significant code duplication in page headers by utilizing `HeroSectionLayout` and `AnimatedBackground`.

### 🔍 Problem

Currently, each tool page (`BurnTokensPage`, `CreateLiquidityPage`, etc.) implements its own `HeroSection` with duplicated:

- Animated background logic (framer-motion variants)
- Layout structure (container, padding, gradients)
- Typography styles

### 🛠️ Implementation Steps

1.  **Audit Hero Sections**
    - [x] `src/components/pages/BurnTokensPage/HeroSection/HeroSection.tsx`
    - [x] `src/components/pages/CreateLiquidityPage/HeroSection/index.tsx`
    - [x] `src/components/pages/TokenCreatorPage/HeroSection/index.tsx`
    - [x] `src/components/pages/FreezeAccountsPage/HeroSection/index.tsx`
    - [x] `src/components/pages/TransactionMultisenderPage/HeroSection/HeroSection.tsx`
    - [x] `src/components/pages/RevokeFreezeAuthorityPage/HeroSection/HeroSection.tsx`
    - [x] `src/components/pages/RevokeMintAuthorityPage/HeroSection/HeroSection.tsx`
    - [x] `src/components/pages/UnfreezeAccountsPage/HeroSection/index.tsx`
    - [x] `src/components/pages/TokenAuditorPage/HeroSection/index.tsx`

2.  **Refactor Strategy**
    - Import `HeroSectionLayout` from `@/components/common/HeroSectionLayout`
    - Import `HeroHeading` from `@/components/common/HeroHeading`
    - Replace custom wrapper divs with `<HeroSectionLayout>`
    - Pass tool-specific content (FeatureHighlights, etc.) as `children`

### ✅ Success Criteria

- Reduction of ~50 lines of code per HeroSection file.
- Consistent animation behavior across all pages.
- Centralized styling for page headers.

---

## Phase 2: React 19 Modernization (Hooks Cleanup)

**Goal:** Simplify code readability and reduce visual noise by relying on React Compiler for memoization.

### 🔍 Problem

The codebase heavily uses `useMemo` and `useCallback` for simple values and event handlers. With React 19 and React Compiler enabled, these are largely redundant and add unnecessary boilerplate.

### 🛠️ Implementation Steps

1.  **Provider Cleanup**
    - **Target:** `src/providers/SolanaProvider.tsx`
    - **Action:** Remove `useMemo` around `wallets` array and `onError` callback if they don't have complex dependencies requiring strict referential equality for external libraries.

2.  **Solana Hooks Cleanup**
    - **Target:** `src/hooks/solana/` (e.g., `useBurnTokens.ts`, `useFreezeAccounts.ts`)
    - **Action:**
      - Remove `useCallback` from `execute...` functions unless passed to a dependency that strictly requires it (React Compiler handles this automatically for most cases).
      - Remove `useMemo` for derived state that isn't computationally expensive.

### ✅ Success Criteria

- Cleaner, more readable hook implementations.
- No performance regression (verified via React DevTools).

---

## Phase 3: Component Standardization

**Goal:** Ensure all page components use the established "Common Component" pattern.

### 🛠️ Implementation Steps

1.  **Audit Page Components**
    - Check for inline implementations of:
      - Loading spinners (Should use `LoadingSpinner`)
      - Tooltips (Should use `InfoTooltip`)
      - External links (Should use `ExplorerLink`)

2.  **Refactor**
    - Replace inline implementations with imports from `@/components/common`.

---

## 📅 Execution Timeline

| Phase | Task                      | Est. Effort | Priority |
| :---- | :------------------------ | :---------- | :------- |
| **1** | Hero Section Refactor     | Medium      | High     |
| **2** | Hooks Cleanup             | Low         | Medium   |
| **3** | Component Standardization | Low         | Low      |

## 📝 Notes

- **Testing:** All changes must be verified on `devnet` to ensure no regression in functionality.
- **Linting:** Maintain `npm run lint:nowarn` standard throughout refactoring.
