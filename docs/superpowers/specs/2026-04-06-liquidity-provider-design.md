# Raydium Liquidity Provider Tool Design Specification

**Date:** 2026-04-06  
**Tool Name:** Liquidity Provider  
**Author:** Claude (with user specifications)  
**Version:** 1.0

## Context

Creating a comprehensive Raydium-only liquidity pool creation tool to complement CloakForge's existing multi-DEX liquidity tool. This specialized tool will leverage Raydium's specific features (CPMM/CLMM pools) and provide advanced functionality for professional liquidity providers while maintaining CloakForge's proven architectural patterns.

**Why this change is needed:**
- Current create-liquidity tool supports multiple DEXs but lacks Raydium-specific optimizations
- Users need access to Raydium's advanced features (concentrated liquidity, specific fee tiers)
- Opportunity to integrate official Raydium SDK v2 for better reliability
- Professional liquidity providers require comprehensive configuration options

**Intended outcome:**
A production-ready tool that enables users to create Raydium liquidity pools with full control over pool types, fee structures, and advanced settings while following CloakForge's security and architectural standards.

## Architecture Overview

**Implementation Approach: SDK-Hybrid Architecture**

The tool follows CloakForge's proven 5-layer architecture with Raydium SDK v2 integration:

```
├── src/app/tools/liquidity-provider/page.tsx       → Route (thin wrapper)
├── src/components/pages/LiquidityProviderPage/      → Page component + comprehensive form
├── src/hooks/solana/useLiquidityProvider.ts         → Client-side logic + wallet integration  
├── src/app/api/solana/liquidity-provider/route.ts  → API route with Raydium SDK integration
└── src/lib/solana/server-side/createRaydiumPool.ts → Server utility using @raydium-io/raydium-sdk-v2
```

**Key Architectural Decisions:**
- Server-side uses `@raydium-io/raydium-sdk-v2` for pool creation and validation
- Client handles wallet signing and form management  
- Hybrid security model: server prepares transactions, client signs
- Comprehensive form with smart defaults and advanced options
- Maintains existing CloakForge patterns for consistency

## Component Structure

**Page Structure:**
```typescript
// src/app/tools/liquidity-provider/page.tsx
<LiquidityProviderPage>
  <HeroSection />           // Raydium-focused hero with CPMM/CLMM explanation
  <LiquidityProviderForm /> // Comprehensive form with all configuration options
  <BenefitsSection />       // Raydium-specific benefits (capital efficiency, etc.)
  <FAQSection />           // Pool creation, fees, and Raydium-specific questions
</LiquidityProviderPage>
```

**Form Sections:**

1. **Pool Type Selection**
   - CPMM (default) - Full-range liquidity, simple to manage
   - CLMM - Concentrated liquidity, capital efficient
   - Clear explanations of differences and use cases

2. **Token Pair Configuration**
   - **Token A** (Required) - User's token mint address with validation
   - **Token B** (Smart defaults) - Dropdown with popular options:
     - **SOL** (default) - Most common pairing
     - **USDC** - Stable dollar pairing  
     - **USDT** - Alternative stable pairing
     - **Custom** - Manual mint address input for advanced users
   - Auto-validation for pool existence
   - Token metadata display (names, symbols, logos)

3. **Liquidity Amounts**
   - Initial Token A amount (defines price ratio)
   - Initial Token B amount (auto-calculated or manual)
   - Real-time price calculation display
   - Balance validation with insufficient funds warnings

4. **Pool Configuration** 
   - Fee tier selection with Raydium-specific options:
     - 0.01% (Most liquid pairs)
     - 0.05% (Standard pairs)
     - 0.25% (Less liquid pairs)  
     - 1.00% (Exotic/new pairs)
   - Slippage tolerance (default 0.5%)
   - Tick spacing (auto-calculated for CLMM based on fee tier)

5. **Advanced Settings (CLMM-specific)**
   - Price range configuration (min/max prices)
   - Custom tick spacing (advanced users)
   - Position concentration level presets

6. **Platform Configuration**
   - Transaction deadline (default 20 minutes)
   - Platform fee (default 0.1%, configurable)
   - Gas fee estimation

7. **Validation Summary**
   - Real-time form validation status
   - Pool creation cost breakdown
   - Final confirmation before submission

## Data Schema

**Form Schema (Zod validation):**
```typescript
export const LiquidityProviderFormSchema = z.object({
  // Pool Type
  poolType: z.enum(['CPMM', 'CLMM']).default('CPMM'),
  
  // Token Configuration  
  tokenA: z.string().min(1, 'Token A address required'),
  tokenB: z.enum(['SOL', 'USDC', 'USDT', 'custom']).default('SOL'),
  customTokenB: z.string().optional(),
  
  // Liquidity Amounts
  amountA: z.string().min(1, 'Token A amount required'),
  amountB: z.string().min(1, 'Token B amount required'),
  
  // Pool Configuration
  feeTier: z.enum(['0.01', '0.05', '0.25', '1.00']).default('0.05'),
  slippageTolerance: z.string().default('0.5'),
  
  // CLMM-specific (conditional validation)
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  tickSpacing: z.number().optional(),
  
  // Advanced Settings
  deadline: z.string().default('20'),
  platformFee: z.string().default('0.1'),
})
```

**API Request/Response Types:**
```typescript
interface LiquidityProviderRequest {
  walletAddress: string
  poolConfig: {
    poolType: 'CPMM' | 'CLMM'
    tokenA: string
    tokenB: string  
    feeTier: string
    initialLiquidity: {
      amountA: string
      amountB: string
    }
    // CLMM-specific
    priceRange?: {
      minPrice: string
      maxPrice: string
    }
  }
  platformFee?: string
}

interface LiquidityProviderResponse {
  serializedTransaction: string
  poolPublicKey: string
  estimatedCosts: {
    poolCreation: number    // ~0.19 SOL (CPMM) or ~0.06 SOL (CLMM)
    platformFee: number
    networkFee: number
  }
  message: string
}
```

## SDK Integration Strategy

**Raydium SDK v2 Integration:**
```typescript
// src/lib/solana/server-side/createRaydiumPool.ts
import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2'

export async function createRaydiumPoolTransaction({
  walletPublicKey,
  poolConfig,
  rpcEndpoint
}: CreateRaydiumPoolParams): Promise<RaydiumPoolResult> {
  // Initialize Raydium SDK with private RPC
  const raydium = await Raydium.load({
    connection: new Connection(rpcEndpoint),
    // Additional SDK configuration
  })
  
  // Pool creation based on type
  if (poolConfig.poolType === 'CPMM') {
    // Create CPMM pool using SDK
  } else {
    // Create CLMM pool using SDK  
  }
  
  // Return serialized transaction for client signing
}
```

**Key SDK Features to Leverage:**
- Pool existence validation (prevent duplicates)
- Optimal fee tier recommendations
- Price calculation and slippage estimation
- Transaction preparation with proper accounts
- Real-time pool data and analytics

## Error Handling & Validation

**Client-side Validations:**
- Token address format (Base58, 44 characters)
- Amount validation (positive numbers, decimal precision)
- Balance validation (sufficient funds for pool + fees)
- Pool existence check (prevent duplicate pools)
- Price range validation (min < max for CLMM)
- Form completeness checks

**Server-side Validations:**
- Token metadata verification via RPC
- Raydium SDK transaction preparation
- Fee calculation accuracy
- Pool creation requirements validation
- Security checks (valid token programs)

**Error Types & Handling:**
```typescript
enum LiquidityProviderErrorType {
  INVALID_TOKEN_ADDRESS = 'Invalid token address format',
  POOL_ALREADY_EXISTS = 'Pool already exists for this token pair',
  INSUFFICIENT_LIQUIDITY = 'Below minimum liquidity requirements',
  INVALID_PRICE_RANGE = 'Invalid price range for CLMM pool',
  SDK_ERROR = 'Raydium SDK integration error',
  INSUFFICIENT_FUNDS = 'Insufficient balance for pool creation',
}
```

## Critical Files to Modify

1. **Page Route:**
   - `src/app/tools/liquidity-provider/page.tsx` (new)
   - `src/app/tools/liquidity-provider/layout.tsx` (new)

2. **Components:**
   - `src/components/pages/LiquidityProviderPage/` (new directory)
   - `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/` (new)
   - Reuse: `src/components/common/UnifiedFormWrapper`
   - Reuse: `src/components/common/CustomFormField`

3. **Business Logic:**
   - `src/hooks/solana/useLiquidityProvider.ts` (new)
   - `src/app/api/solana/liquidity-provider/route.ts` (new)
   - `src/lib/solana/server-side/createRaydiumPool.ts` (new)

4. **Schemas & Types:**
   - Extend `src/lib/schemas/apiSchemas.ts`
   - Create `src/types/liquidityProvider.ts` (new)

5. **Configuration:**
   - Update `src/lib/config/getToolUIConfig.ts`
   - Update navigation data files

## Reusable Functions & Utilities

**Existing utilities to leverage:**
- `validateBalance()` from `src/lib/solana/validateBalance.ts`
- `getLogger()` from `src/lib/logger/logger.ts`
- `apiClient()` from `src/lib/utils/apiClient.ts`
- `CustomFormField` from `src/components/common/`
- `UnifiedFormWrapper` from `src/components/common/`

**New utilities to create:**
- `validateTokenPair()` - Check token pair validity and existence
- `calculatePoolPrice()` - Real-time price calculation
- `estimatePoolCosts()` - Comprehensive cost estimation
- `formatRaydiumError()` - SDK error message formatting

## Verification Plan

**End-to-end verification:**
1. **Form validation** - Test all input combinations and edge cases
2. **Token validation** - Test with real/fake token addresses
3. **Pool creation** - Create pools on Raydium devnet
4. **Error handling** - Trigger and verify all error scenarios
5. **Cost calculation** - Verify fee calculations match Raydium's actual costs
6. **SDK integration** - Verify Raydium SDK v2 works as expected
7. **Security** - Test wallet integration and transaction signing

**Testing commands:**
```bash
npm run lint:nowarn && npx tsc --noEmit  # Code quality
npm test -- --testNamePattern="liquidityProvider" # Unit tests
npm run build # Production build verification
```

**Manual testing scenarios:**
- Create CPMM pool with SOL/custom token
- Create CLMM pool with price ranges
- Test with insufficient funds
- Test duplicate pool creation
- Verify transaction signatures and confirmations

## Success Criteria

**Functional requirements:**
- ✅ Users can create CPMM and CLMM pools on Raydium
- ✅ Comprehensive form with all advanced options
- ✅ Smart defaults for Token B (SOL, USDC, USDT)
- ✅ Real-time validation and cost estimation
- ✅ Integration with Raydium SDK v2
- ✅ Proper error handling and user feedback

**Technical requirements:**
- ✅ Follows CloakForge 5-layer architecture
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ Comprehensive test coverage
- ✅ Proper logging and error tracking
- ✅ Security best practices (server prepares, client signs)

**User experience requirements:**
- ✅ Intuitive form flow with smart defaults
- ✅ Clear explanations of CPMM vs CLMM
- ✅ Real-time feedback and validation
- ✅ Professional UI consistent with existing tools
- ✅ Comprehensive help documentation and FAQs