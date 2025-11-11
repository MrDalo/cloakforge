# 🏗️ CloakForge Architecture

> **Comprehensive system architecture, design patterns, and technical foundations**

Last updated: 2025-10-14

## 📋 Table of Contents

- [Vision & Goals](#vision--goals)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Provider Architecture](#provider-architecture)
- [Project Structure](#project-structure)
- [Core Principles](#core-principles)
- [Design Patterns](#design-patterns)

---

## 🎯 Vision & Goals

### Mission

CloakForge is a **privacy-first, professional-grade suite** of Solana token management tools. The platform prioritizes:

- ✅ **Zero Data Collection** - No tracking, analytics, or user data storage
- ✅ **Low Fees** - Transparent, competitive pricing with no hidden costs
- ✅ **Enterprise Security** - Hardware wallet support, multi-signature transactions
- ✅ **Developer Friendly** - Clean codebase, comprehensive documentation
- ✅ **Global Access** - Mobile-first, responsive, accessible to all

### Core Tools

1. **Token Creator** - SPL token creation with metadata and authorities
2. **Token Burner** - Secure supply reduction and deflationary tokenomics
3. **Freeze/Unfreeze** - Account state management
4. **Authority Management** - Revoke mint/freeze authorities for decentralization
5. **Multi-Sender** - Batch transfers up to 500 recipients
6. **Create Liquidity** - Liquidity pool management (DEX integration)
7. **Portfolio Tracker** - Real-time balance and analytics

### Privacy-First Principles

- **No Analytics** - Zero tracking, cookies, or user identification
- **Client-Side Processing** - All operations happen in your browser
- **Self-Custody** - Users maintain complete control of their wallets
- **On-Chain Only** - No server-side user data storage

---

## 🛠️ Tech Stack

### Frontend Framework

- **Next.js 15** - React framework with App Router
- **TypeScript 5.0+** - Strict mode for type safety
- **React 19** - Latest React features

### Styling & UI

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Radix UI** - Accessible, unstyled UI primitives
- **Framer Motion** - Smooth animations

### Blockchain & Web3

- **@solana/web3.js** - Older Solana JavaScript SDK
- **@solana/kit** - Latest Solana JavaScript SDK
- **@solana/spl-token** - SPL Token library
- **@solana/wallet-adapter** - Multi-wallet integration
- **Token Extensions** - TOKEN_2022 program support

### State Management

- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client state management (minimal global state)
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### Development Quality

- **ESLint** - Zero warnings policy
- **Prettier** - Consistent code formatting
- **Husky** - Git hooks for quality assurance
- **TypeScript Strict** - Maximum type safety

### Infrastructure

- **Pino** - High-performance structured logging
- **Pinata** - IPFS storage for token metadata
- **Contentful** - CMS for tool configuration (optional)

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser (Client)                    │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router  │  Components  │  Hooks  │  Providers  │
├──────────────────────┴──────────────┴─────────┴─────────────┤
│                    Public RPC (Wallet Adapter)              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (/app/api)                    |
├─────────────────────────────────────────────────────────────┤
│           Validation  │  Business Logic  │  Security        │
├───────────────────────┴──────────────────┴──────────────────┤
│                    Private RPC (Server Config)              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Solana Blockchain                      │
│              (mainnet-beta / devnet)                        │
└─────────────────────────────────────────────────────────────┘
```

### Hybrid Architecture Pattern

**Client-Side:**

- Transaction signing (wallet adapter)
- Balance validation (pre-flight check)
- Transaction submission
- UI state management

**Server-Side:**

- Transaction preparation (unsigned)
- Fee calculation
- Validation (ownership, balances)
- Business logic
- Private RPC usage (rate-limit free)

### RPC Strategy

| Endpoint Type   | Location | Usage                                  | Benefits                         |
| --------------- | -------- | -------------------------------------- | -------------------------------- |
| **Public RPC**  | Client   | Transaction submission, balance checks | User's wallet adapter connection |
| **Private RPC** | Server   | Transaction prep, validation           | No rate limits, faster, reliable |

---

## 🎭 Provider Architecture

### Provider Hierarchy

```tsx
<AppProvider toolConfigs={toolConfigs}>
  <ConfigProvider>
    <SolanaProvider>
      <QueryProvider>
        <ToolConfigProvider initialConfigs={toolConfigs}>{children}</ToolConfigProvider>
      </QueryProvider>
    </SolanaProvider>
  </ConfigProvider>
</AppProvider>
```

### Provider Responsibilities

#### 1. ConfigProvider

- Environment configuration access
- RPC endpoints
- Feature flags
- Network selection (mainnet/devnet)

#### 2. SolanaProvider

- Wallet adapter integration
- Connection management
- Multi-wallet support (Phantom, Solflare, etc.)
- Auto-connect functionality

#### 3. QueryProvider

- TanStack Query client
- Cache configuration
- Retry logic
- Optimistic updates

#### 4. ToolConfigProvider

- Contentful-based tool configuration
- Remote tool enable/disable
- Dynamic fee configuration
- 5-minute cache with server-side fetch

### Single AppProvider Pattern

All providers are wrapped in a **single AppProvider** for:

- ✅ Centralized architecture
- ✅ Server-side compliance
- ✅ Cleaner layout components
- ✅ Easier dependency management

---

## 📁 Project Structure

```
cloakforge/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── tools/                # Tool-specific pages
│   │   │   ├── token-creator/
│   │   │   ├── burn-tokens/
│   │   │   ├── freeze-accounts/
│   │   │   └── transaction-multisender/
│   │   ├── api/                  # API routes
│   │   │   ├── solana/           # Solana-specific endpoints
│   │   │   ├── log/              # Client logging endpoint
│   │   │   └── site-banner/      # Contentful banner config
│   │   ├── account/              # Portfolio tracker
│   │   └── layout.tsx            # Root layout with providers
│   │
│   ├── components/               # React components
│   │   ├── common/               # 20+ reusable components
│   │   │   ├── InfoTooltip/
│   │   │   ├── ExplorerLink/
│   │   │   ├── LoadingSpinner/
│   │   │   ├── WalletConnectionButton/
│   │   │   └── ...               # CHECK HERE FIRST!
│   │   ├── pages/                # Page-specific components
│   │   │   └── [ToolName]Page/
│   │   │       ├── index.tsx
│   │   │       ├── [ToolName]Form/
│   │   │       └── FAQSection/
│   │   └── ui/                   # shadcn/ui base components
│   │
│   ├── lib/                      # Business logic & utilities
│   │   ├── solana/               # Solana operations
│   │   │   ├── address.ts        # Address validation & formatting
│   │   │   ├── balance.ts        # Balance checks & conversions
│   │   │   ├── transactions.ts   # Transaction building & confirmation
│   │   │   ├── rpc.ts            # RPC connection management
│   │   │   ├── tokens.ts         # Token metadata utilities
│   │   │   ├── index.ts          # Barrel export (use this!)
│   │   │   ├── createToken.ts    # Tool-specific utilities
│   │   │   ├── burnToken.ts
│   │   │   ├── utils.ts          # (deprecated, use index.ts)
│   │   │   └── ...
│   │   ├── logger/               # Centralized logging
│   │   ├── config/               # Configuration management
│   │   ├── ipfs/                 # IPFS metadata storage
│   │   ├── toast/                # User feedback system
│   │   └── utils/                # General utilities
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── queries/              # TanStack Query hooks
│   │   ├── mutations/            # Mutation hooks
│   │   └── solana/               # Solana-specific hooks
│   │
│   ├── providers/                # React context providers
│   │   ├── AppProvider.tsx       # Main provider wrapper
│   │   ├── SolanaProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   └── ToolConfigProvider.tsx
│   │
│   ├── stores/                   # Zustand state stores
│   │   └── toolConfigStore.ts
│   │
│   └── types/                    # TypeScript definitions
│       ├── api.ts
│       ├── error.ts
│       ├── config.ts
│       └── ...
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # This file
│   ├── DEVELOPMENT.md            # Development guide
│   ├── TOOLING.md                # Tool implementation
│   └── TROUBLESHOOTING.md        # Error handling
│
└── public/                       # Static assets
```

### File Naming Conventions

- **Components**: PascalCase (`TokenCreator.tsx`)
- **Utilities**: camelCase (`validateAddress.ts`)
- **Routes**: kebab-case (`token-creator/`)
- **Types**: PascalCase interfaces, camelCase files

---

## 🎯 Core Principles

CloakForge is built on **five foundational principles** that guide all development decisions:

### 1. KISS - Keep It Simple, Stupid

**Simple code is robust code; complexity is fragile.**

- Avoid over-engineering and premature abstractions
- Clarity over cleverness - code should read like a story
- If you can't explain it simply, refactor it
- Don't build abstractions until needed 3+ times

**Example:**

```tsx
// ✅ GOOD: Simple, clear
function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

// ❌ BAD: Over-engineered
class AddressFormatter {
  constructor(private config: FormatterConfig) {}
  format(address: string, options?: FormatOptions): string {
    // 50 lines of unnecessary complexity
  }
}
```

### 2. DRY - Don't Repeat Yourself

**Single source of truth for all business logic.**

- **Before creating anything new:**
  1. Check `src/components/common/` for existing components
  2. Search `src/lib/` for existing utilities
  3. Look for similar patterns in other tools
  4. Extend existing code rather than duplicate
- Abstract common patterns when used 3+ times
- Share code between similar tools

**Example:**

```tsx
// ✅ GOOD: Reuse existing utility
import { validateBalance } from '@/lib/solana/validateBalance'

// ❌ BAD: Duplicate validation logic
const balance = await connection.getBalance(wallet)
if (balance < required) {
  /* ... */
}
```

### 3. Clear Purpose

**Every file, function, and component has ONE responsibility.**

- Name things for what they DO, not what they ARE
- Functions should be small and focused (< 50 lines ideally)
- Comments explain WHY, code explains HOW
- Single Responsibility Principle throughout

**Example:**

```tsx
// ✅ GOOD: Clear single purpose
function calculateTotalFee(serviceFee: number, networkFee: number): number {
  return serviceFee + networkFee
}

// ❌ BAD: Multiple responsibilities
function processTransaction(tx: Transaction) {
  // Validates, calculates fees, sends transaction, updates UI
  // 200 lines of mixed concerns
}
```

### 4. Developer-First

**Code is read 10x more than written - optimize for readability.**

- Consistent patterns reduce cognitive load
- Comprehensive error messages that help debugging
- Self-documenting code with clear variable names
- Helpful comments for complex business logic
- Reference `/docs` before implementing features
- Follow established patterns

**Example:**

```tsx
// ✅ GOOD: Self-documenting
const hasInsufficientBalance = walletBalance < estimatedTotalCost
if (hasInsufficientBalance) {
  throw new SolanaError(`Need ${estimatedTotalCost} SOL, have ${walletBalance} SOL`, 'INSUFFICIENT_FUNDS')
}

// ❌ BAD: Cryptic
if (wb < etc) throw new Error('err')
```

### 5. Maintainability

**Future developers (including yourself) will thank you.**

- Easy to change, easy to test, easy to understand
- No magic numbers or hidden dependencies
- Explicit is better than implicit
- Type safety with strict TypeScript mode
- Zod validation for runtime safety
- Privacy by design (no tracking, client-side first)
- Performance conscious (lazy loading, optimistic updates)

**Example:**

```tsx
// ✅ GOOD: Explicit and maintainable
const SERVICE_FEE_SOL = 0.01
const NETWORK_FEE_SOL = 0.0005
const totalCost = SERVICE_FEE_SOL + NETWORK_FEE_SOL

// ❌ BAD: Magic numbers
const totalCost = 0.01 + 0.0005 // What are these numbers?
```

---

### Why These Principles?

**CloakForge previously suffered from over-engineering:**

- 10+ overlapping documentation files (now 4)
- 6 error handling files with 4+ error classes (being simplified)
- Duplicate utilities across the codebase
- Complex abstractions used only once

**These principles prevent regression:**

- **KISS** prevents over-engineering
- **DRY** prevents duplication
- **Clear Purpose** prevents confusion
- **Developer-First** prevents cognitive overload
- **Maintainability** prevents technical debt

**When in doubt, choose simplicity.** ✨

---

## 🎨 Design Patterns

### Component Patterns

#### 1. Common Component Pattern

```tsx
// ALWAYS check components/common/ first!
import { InfoTooltip, LoadingSpinner, ExplorerLink } from '@/components/common'
```

#### 2. Page Component Pattern

```
components/pages/FeaturePage/
├── index.tsx              # Main page component
├── FeatureForm/           # Form components
│   ├── index.tsx
│   ├── FormSections.tsx
│   └── schema.ts
├── FAQSection/            # FAQ display
└── featureData.ts         # Static content
```

#### 3. Tool Integration Pattern

```tsx
// Hook for business logic
const { execute, isExecuting } = useToolName()

// Form for user input
<ToolNameForm onSubmit={execute} />

// Feedback for user
<LoadingSpinner /> {/* When executing */}
<ExplorerLink signature={result} /> {/* On success */}
```

### State Management Patterns

#### Server State (React Query)

```tsx
// Queries for data fetching
const { data, isLoading } = useTokenBalance(address)

// Mutations for state changes
const { mutate } = useBurnTokens()
```

#### Client State (Zustand)

```tsx
// Minimal global state only
const config = useToolConfigStore((state) => state.config)
```

### API Route Pattern

```tsx
export async function POST(request: NextRequest) {
  try {
    // 1. Security validation
    await validateSecurity(request)

    // 2. Input validation (Zod)
    const validated = schema.parse(await request.json())

    // 3. Business logic
    const result = await performOperation(validated)

    // 4. Structured response
    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: result,
    })
  } catch (error) {
    // Centralized error handling
    return handleApiError(error)
  }
}
```

---

## 🔐 Security Architecture

### Transaction Security

1. **Client-Side Signing** - All transactions signed in user's wallet
2. **Ownership Validation** - Server validates user owns accounts
3. **Balance Pre-checks** - Client validates sufficient funds before API call
4. **Simulation** - Transactions simulated before submission

### API Security

1. **Origin Validation** - Request origin checking
2. **Input Validation** - Multi-layer validation (Zod + Solana PublicKey)
3. **Rate Limiting** - Private RPC prevents rate limit issues
4. **No Secrets Client-Side** - All sensitive config server-only

### Wallet Security

1. **Hardware Wallet Support** - Ledger, Trezor integration
2. **Multi-Signature Ready** - Supports multisig transactions
3. **Never Store Keys** - Zero server-side key storage
4. **Wallet Adapter** - Industry-standard wallet integration

---

## 📊 Performance Optimizations

### RPC Optimization

- **Client**: Public RPC for transaction submission only
- **Server**: Private RPC for all validation/preparation
- **Batching**: Combine multiple RPC calls where possible
- **Caching**: React Query cache for frequently accessed data

### Component Optimization

- **Lazy Loading**: Heavy components loaded on demand
- **Code Splitting**: Route-based code splitting automatic
- **Memoization**: React.memo for expensive components
- **Virtualization**: Large lists use virtual scrolling

### Network Optimization

- **Versioned Transactions**: Reduced transaction size
- **Address Lookup Tables**: Batch operations optimization
- **Parallel Requests**: Non-dependent API calls run parallel
- **Optimistic Updates**: UI updates before confirmation

---

## 🌐 Deployment Architecture

### Environments

- **Development** - Local development with devnet
- **Staging** - Preview deployments on devnet
- **Production** - Live application on mainnet-beta

### Environment Variables

```bash
# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=<public_rpc_endpoint>
RPC_PRIVATE_ENDPOINT=<private_rpc_endpoint>

# IPFS Configuration
PINATA_JWT=<your_jwt>
PINATA_GATEWAY_URL=<gateway_url>

# Optional: Contentful CMS
CONTENTFUL_SPACE_ID=<space_id>
CONTENTFUL_ACCESS_TOKEN=<access_token>

# Logging
LOG_LEVEL=info
```

### Deployment Strategy

1. **Build** - Static optimization and SSR prep
2. **Environment Config** - Runtime environment selection
3. **Network Selection** - Mainnet vs Devnet routing
4. **Caching** - Optimal cache headers
5. **Monitoring** - Structured logging for debugging

---

## 📚 References

- [Development Guide](./DEVELOPMENT.md) - Setup and workflows
- [Tooling Guide](./TOOLING.md) - Tool implementation patterns
- [Troubleshooting](./TROUBLESHOOTING.md) - Error handling and debugging
- [README](../README.md) - Quick start and overview

---

**Built with ❤️ for the Solana ecosystem**
