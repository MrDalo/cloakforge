# 🚀 CloakForge Development Guide

> **Complete guide for setting up, developing, and contributing to CloakForge**

Last updated: 2025-10-14

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Strategy](#testing-strategy)
- [Git Workflow](#git-workflow)
- [Quality Gates](#quality-gates)

---

## ⚡ Quick Start

### Prerequisites

- **Node.js 18+**
- **npm, yarn, pnpm, or bun**
- **Solana wallet** (Phantom, Solflare, etc.)
- **Git**

### Installation

```bash
# Clone repository
git clone https://github.com/MrDalo/cloakforge.git
cd cloakforge

# Install dependencies
npm install --legacy-peer-deps

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Configuration

```bash
# .env.local

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet  # or mainnet-beta
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
RPC_PRIVATE_ENDPOINT=<your_private_rpc>  # For server-side operations

# IPFS Configuration (Token Creator)
PINATA_JWT=<your_pinata_jwt>
PINATA_GATEWAY_URL=https://gateway.pinata.cloud

# Contentful CMS (Optional - for tool configs)
CONTENTFUL_SPACE_ID=<space_id>
CONTENTFUL_ACCESS_TOKEN=<access_token>

# Service Fee Configuration
FEE_WALLET_ADDRESS=<your_fee_wallet>  # For service fee collection

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

---

## 🔧 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:nowarn     # ESLint with ZERO warnings policy
npm run lint:fix        # Auto-fix linting issues
npm run format          # Check Prettier formatting
npm run format:fix      # Auto-fix formatting

# Type Checking
npm run type-check      # TypeScript type checking
```

### Development Server

```bash
npm run dev
```

Features:

- ✅ Hot reload on file changes
- ✅ Fast refresh for React components
- ✅ TypeScript error overlay
- ✅ Detailed error messages

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm run start
```

---

## 📝 Code Standards

### TypeScript Standards

#### Strict Mode Always

```tsx
// ✅ GOOD: Explicit types
interface TokenData {
  address: string
  balance: number
  decimals: number
}

function getToken(address: string): Promise<TokenData> {
  // Implementation
}

// ❌ BAD: Implicit any
function getToken(address) {
  // No types
}
```

#### Type Safety Rules

```tsx
// ✅ GOOD: Proper error typing
catch (error: unknown) {
  if (error instanceof Error) {
    logger.error(error.message)
  }
}

// ❌ BAD: Any type
catch (error: any) {
  console.log(error)
}
```

### Component Standards

#### Component Structure

```tsx
// ✅ GOOD: Clean component structure
interface TokenCardProps {
  token: TokenData
  onSelect: (address: string) => void
}

export function TokenCard({ token, onSelect }: TokenCardProps) {
  const [isSelected, setIsSelected] = useState(false)

  const handleClick = useCallback(() => {
    setIsSelected(true)
    onSelect(token.address)
  }, [token.address, onSelect])

  return <div className='rounded-lg border p-4'>{/* Component JSX */}</div>
}
```

#### Component File Organization

```
ComponentName/
├── index.tsx           # Main component export
├── ComponentName.tsx   # Component implementation
├── types.ts            # Component-specific types
└── utils.ts            # Component utilities
```

### Utility Standards

#### Single Responsibility

```tsx
// ✅ GOOD: Single purpose
export function formatTokenAmount(amount: number, decimals: number): string {
  return (amount / Math.pow(10, decimals)).toFixed(decimals)
}

// ❌ BAD: Multiple responsibilities
export function formatAndValidateToken(token: any) {
  // Formatting AND validation in one function
}
```

#### Use Existing Utilities

```tsx
// ✅ GOOD: Use existing utilities from /lib/solana barrel export
import { lamportsToSol } from '@/lib/solana'

// ❌ BAD: Duplicate utility
const convertLamports = (lamports) => lamports / 1000000000

// ❌ BAD: Old import pattern (deprecated)
import { lamportsToSol } from '@/lib/solana/utils'
```

#### Solana Utilities Organization

CloakForge consolidates all Solana utilities into **domain-focused modules** for better maintainability:

```tsx
// ✅ ALWAYS import from barrel export
import {
  isValidSolanaAddress, // address.ts
  lamportsToSol, // balance.ts
  createTransaction, // transactions.ts
  isRpcHealthy, // rpc.ts
  fetchImage, // tokens.ts
  LAMPORTS_PER_SOL, // constant
} from '@/lib/solana'
```

**Domain Modules:**

1. **address.ts** - Address validation, formatting, type conversions
2. **balance.ts** - Balance checks, price fetching, unit conversions, wallet validation
3. **transactions.ts** - Transaction building, confirmation, compute budgets, priority fees
4. **rpc.ts** - RPC connection management, health checks, cluster detection
5. **tokens.ts** - Token metadata utilities, image fetching, formatting

**Tool-Specific Utilities:**

- Tool-specific functions remain in dedicated files (e.g., `createToken.ts`, `burnToken.ts`)
- Import directly: `import { validateBalance } from '@/lib/solana/validateBalance'`

**Deprecated:**

- `utils.ts` file still exists for backward compatibility but should NOT be used in new code
- All utilities re-exported from `index.ts` (barrel export)

### Naming Conventions

| Type             | Convention           | Example                            |
| ---------------- | -------------------- | ---------------------------------- |
| Components       | PascalCase           | `TokenCard`, `BurnForm`            |
| Hooks            | camelCase with "use" | `useTokenBalance`, `useBurnTokens` |
| Utilities        | camelCase            | `formatAddress`, `validateInput`   |
| Types/Interfaces | PascalCase           | `TokenData`, `ApiResponse`         |
| Constants        | UPPER_SNAKE_CASE     | `MAX_TOKENS`, `DEFAULT_DECIMALS`   |
| Files (routes)   | kebab-case           | `token-creator/`, `burn-tokens/`   |

---

<!-- ## 🧪 Testing Strategy

### Test on Devnet First

```bash
# Always test with devnet before mainnet
NEXT_PUBLIC_SOLANA_NETWORK=devnet npm run dev
```

#### Devnet Testing Checklist

- [ ] Transaction creation works
- [ ] Fee calculation accurate
- [ ] Error handling proper
- [ ] UI updates correctly
- [ ] Explorer links valid

### Manual Testing Workflow

#### 1. Unit Testing (Utilities)

```tsx
// Test pure functions independently
import { isValidSolanaAddress } from '@/lib/solana'

describe('isValidSolanaAddress', () => {
  it('accepts valid Solana address', () => {
    const valid = isValidSolanaAddress('11111111111111111111111111111111')
    expect(valid).toBe(true)
  })

  it('rejects invalid address', () => {
    const invalid = isValidSolanaAddress('invalid')
    expect(invalid).toBe(false)
  })
})
```

#### 2. Integration Testing (Tools)

- Test complete user workflows
- Test with different wallet types
- Test error scenarios
- Test edge cases (insufficient balance, invalid input)

#### 3. Browser Testing

Test on:
- Chrome/Brave (primary)
- Firefox
- Safari
- Mobile browsers

### Validation Checklist

Before submitting a PR:

- [ ] All TypeScript errors resolved
- [ ] Zero ESLint warnings (`npm run lint:nowarn`)
- [ ] Prettier formatting applied
- [ ] Tested on devnet
- [ ] Tested with different wallets
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Success feedback provided
- [ ] Mobile responsive

--- -->

## 🔀 Git Workflow

### Branch Strategy

```bash
# Feature branches
git checkout -b feature/token-freeze

# Bug fixes
git checkout -b fix/burn-amount-validation

# Documentation
git checkout -b docs/update-readme
```

### Commit Message Format

```bash
# Format: <type>: <description>

# Examples:
git commit -m "feat: add batch token burning"
git commit -m "fix: correct balance validation"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify error handling"
git commit -m "style: format with prettier"
```

#### Commit Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Test additions/changes
- `chore` - Build process, dependencies

### Pull Request Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Follow code standards
   - Add tests if applicable
   - Update documentation

3. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: descriptive message"
   ```

4. **Push Branch**

   ```bash
   git push origin feature/my-feature
   ```

5. **Create Pull Request**
   - Clear title and description
   - Reference related issues
   - Add screenshots for UI changes
   - List breaking changes

6. **Code Review**
   - Address feedback
   - Make requested changes
   - Re-request review

7. **Merge**
   - Squash commits if needed
   - Delete branch after merge

---

## ✅ Quality Gates

### Zero Warnings Policy

**All code must have ZERO ESLint warnings:**

```bash
# Check for warnings
npm run lint:nowarn

# Fix automatically where possible
npm run lint:fix
```

Common warning categories:

- Unused variables
- Missing dependencies in useEffect/useCallback
- Implicit any types
- Unused imports

### Code Review Checklist

For reviewers:

- [ ] **Type Safety**: All types explicit, no `any` without reason
- [ ] **Reusability**: Check for duplicate code/components
- [ ] **Utilities**: Existing utilities used where appropriate
- [ ] **Documentation**: Code changes documented
- [ ] **Error Handling**: Proper error handling and user feedback
- [ ] **Performance**: No obvious performance issues
- [ ] **Security**: No hardcoded secrets or security issues
- [ ] **Testing**: Changes tested on devnet
- [ ] **Mobile**: Responsive design maintained

---

## 🏗️ Feature Development Process

### Step 1: Planning

1. **Check Existing Code**
   - Search for similar features
   - Identify reusable components
   - Review existing patterns

2. **Design API**
   - Define request/response types
   - Plan validation schema
   - Document endpoints

3. **Plan Components**
   - Identify UI components needed
   - Check for existing components
   - Design component hierarchy

### Step 2: Implementation

1. **Create Types** (`/types`)

   ```tsx
   export interface MyToolRequest {
     walletAddress: string
     // ... fields
   }

   export interface MyToolResponse {
     signature: string
     // ... fields
   }
   ```

2. **Create Schema** (`/lib/schemas`)

   ```tsx
   export const myToolSchema = z.object({
     walletAddress: solanaAddressSchema,
     // ... validation
   })
   ```

3. **Create API Route** (`/app/api`)

   ```tsx
   export async function POST(request: NextRequest) {
     // Implementation following standard pattern
   }
   ```

4. **Create Hook** (`/hooks/solana`)

   ```tsx
   export function useMyTool() {
     // Hook implementation
   }
   ```

5. **Create Components** (`/components/pages`)
   ```tsx
   export function MyToolPage() {
     // Page component
   }
   ```

<!-- ### Step 3: Testing

1. Test on devnet
2. Test all user flows
3. Test error scenarios
4. Test with different wallets
5. Test on mobile -->

### Step 4: Documentation

1. Update README if needed
2. Add/update relevant docs
3. Document any new patterns
4. Add inline code comments

### Step 5: Review & Deploy

1. Create PR with description
2. Address review feedback
3. Merge to main
4. Monitor for issues

---

## 🐛 Debugging Tips

### Enable Debug Logging

```bash
# .env.local
LOG_LEVEL=debug
```

### Browser DevTools

```tsx
// Temporary debug logging
console.log('[DEBUG] Token data:', tokenData)

// Remove before committing!
```

### React Query DevTools

```tsx
// Already integrated in development
// Open DevTools and look for React Query tab
```

### Common Issues

#### Issue: RPC Rate Limiting

**Solution**: Use private RPC for server-side operations

```tsx
// ✅ GOOD: Server uses private RPC
const serverConfig = getServerConfig()
const connection = new Connection(serverConfig.rpcPrivateEndpoint)

// ❌ BAD: Server uses public RPC
const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!)
```

#### Issue: Transaction Failing

**Solution**: Check simulation and logs

```tsx
try {
  // Simulate before sending
  const simulation = await connection.simulateTransaction(transaction)
  if (simulation.value.err) {
    logger.error('Simulation failed', simulation.value.logs)
  }
} catch (error) {
  logger.error('Transaction error', error)
}
```

#### Issue: Wallet Not Connecting

**Solution**: Check wallet adapter configuration

```tsx
// Ensure wallets are properly configured
const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [])
```

---

## 📚 Key Development Principles

CloakForge follows **five core principles** that guide all development:

### 1. KISS (Keep It Simple, Stupid)

**Simple code is robust code; complexity is fragile.**

- Avoid over-engineering and premature abstractions
- Clarity over cleverness - if you can't explain it simply, refactor
- Don't build abstractions until needed 3+ times (YAGNI)
- Code should be readable by junior developers

**Practical Application:**

```tsx
// ✅ SIMPLE: Direct and clear
const isValidAddress = address.length === 44

// ❌ COMPLEX: Unnecessary abstraction
class AddressValidator {
  private readonly config: ValidationConfig
  validate(address: string, rules?: ValidationRules): ValidationResult {
    // 100 lines of abstraction used only once
  }
}
```

### 2. DRY (Don't Repeat Yourself)

**Single source of truth for all logic.**

- **Always check first:** `src/components/common/` for components, `src/lib/` for utilities
- Abstract patterns when used 3+ times
- Share code between similar tools
- Use existing Solana utilities (NEVER create custom `LAMPORTS_PER_SOL`)

**Practical Application:**

```tsx
// ✅ REUSE: Import existing utility
import { lamportsToSol } from '@/lib/solana'

// ❌ DUPLICATE: Recreating existing logic
const solAmount = lamports / 1000000000
```

### 3. Clear Purpose

**Every piece of code has ONE clear responsibility.**

- Files, functions, components = single purpose
- Name things for what they DO: `calculateFee()` not `feeHandler()`
- Keep functions small (< 50 lines ideally)
- Comments explain WHY, code explains HOW

**Practical Application:**

```tsx
// ✅ CLEAR PURPOSE: One responsibility
function calculateTotalFee(serviceFee: number, networkFee: number): number {
  return serviceFee + networkFee
}

// ❌ UNCLEAR: Multiple responsibilities
function handleTransaction(tx: Transaction) {
  // Validates, calculates fees, signs, sends, updates UI
  // 300 lines mixing concerns
}
```

### 4. Developer-First

**Code is read 10x more than written.**

- Self-documenting code with clear names
- Consistent patterns across the codebase
- Helpful error messages with context
- Comprehensive documentation in `/docs`
- TypeScript types as documentation
- Fail fast with clear validation

**Practical Application:**

```tsx
// ✅ DEVELOPER-FIRST: Clear and helpful
const hasInsufficientBalance = walletBalance < totalRequiredCost
if (hasInsufficientBalance) {
  throw new SolanaError(`Insufficient funds. Required: ${totalRequiredCost} SOL, Available: ${walletBalance} SOL`, 'INSUFFICIENT_FUNDS')
}

// ❌ CRYPTIC: Unhelpful for debugging
if (b < c) throw new Error('e')
```

### 5. Maintainability

**Future you (and others) will thank you.**

- Explicit over implicit (no magic)
- Easy to change, test, and understand
- No hidden dependencies or side effects
- Composition over configuration
- Type safety with TypeScript strict mode
- Zero ESLint warnings policy

**Practical Application:**

```tsx
// ✅ MAINTAINABLE: Explicit constants
const SERVICE_FEE_SOL = 0.01
const ESTIMATED_NETWORK_FEE_SOL = 0.0005
const totalCost = SERVICE_FEE_SOL + ESTIMATED_NETWORK_FEE_SOL

// ❌ UNMAINTAINABLE: Magic numbers
const cost = 0.01 + 0.0005 // What are these?
```

---

### Principles in Practice

**Before Phase 1 (Documentation Refactor):**

- 10+ overlapping documentation files
- Developers lost in the repo
- Duplication and confusion

**After Phase 1:**

- 4 focused documentation files
- Clear navigation and purpose
- 43% reduction in content, 100% increase in clarity

**This is KISS, DRY, Clear Purpose, Developer-First, and Maintainability in action.** ✨

### Decision Framework

When writing code, ask yourself:

1. **KISS:** Is this the simplest solution?
2. **DRY:** Does this already exist somewhere?
3. **Clear Purpose:** What is the ONE thing this does?
4. **Developer-First:** Will others understand this in 6 months?
5. **Maintainability:** How easy is this to change?

If you can't answer these confidently, **refactor before committing.**

---

## 📖 Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System design and patterns
- [Tooling Guide](./TOOLING.md) - Tool implementation guide
- [Troubleshooting](./TROUBLESHOOTING.md) - Error handling and debugging
- [README](../README.md) - Project overview

---

**Happy coding! 🚀**
