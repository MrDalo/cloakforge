# GitHub Copilot Instructions for CloakForge

## 🏗️ Project Mission & Context

**CloakForge** is a comprehensive, privacy-first platform for Solana blockchain token management. This is a professional-grade suite designed for both developers and non-technical users.

### **Core Values & Principles**

## 📜 Essential Documentation

CloakForge has **4 core documentation files** that define everything you need to know:

1. **[ARCHITECTURE.md](../docs/ARCHITECTURE.md)** - System design, tech stack, provider patterns
2. **[DEVELOPMENT.md](../docs/DEVELOPMENT.md)** - Setup, workflows, code standards, testing
3. **[TOOLING.md](../docs/TOOLING.md)** - Tool implementation guide with reference examples
4. **[TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)** - Error handling, common issues, debugging

**Documentation-First Development:**

- Reference these docs BEFORE implementing features
- Follow established patterns documented in guides
- Update relevant docs when changing architecture or patterns
- **NEVER create new `.md` documentation files** - update existing docs instead

### 📋 Documentation Update Policy

**When you need to document something:**

1. **Identify the right existing doc:**
   - System design, architecture, tech stack → Update [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
   - Setup, workflows, code standards → Update [DEVELOPMENT.md](../docs/DEVELOPMENT.md)
   - Tool implementation patterns → Update [TOOLING.md](../docs/TOOLING.md)
   - Error handling, debugging → Update [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)

2. **Update in-place:**
   - Add to existing sections
   - Create new sections within existing docs
   - Update table of contents if needed
   - Include date of update

3. **NEVER create:**
   - New `.md` files in root directory
   - New documentation files in `/docs` folder
   - Migration guides (update TROUBLESHOOTING.md instead)
   - Temporary documentation files

**Why?** We follow the **KISS principle** - 4 focused docs are easier to maintain and navigate than 10+ scattered files.

## 🛠️ Complete Tech Stack

### **Frontend Architecture**

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.0+ (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Animations**: Framer Motion for smooth interactions
- **Documentation**: All architectural features documented in `/docs` folder

### **Blockchain & Web3**

- **Primary**: @solana/web3.js, @solana/spl-token, @solana/wallet-adapter
- **Networks**: Both mainnet-beta and devnet support
- **Programs**: SPL Token + Token Extensions Program (TOKEN_2022)

### **State & Data Management**

- **Server State**: TanStack Query (React Query)
- **Client State**: Zustand for global state
- **Forms**: React Hook Form + Zod validation
- **Logging**: Pino high-performance logging system

### **Quality & Development**

- **Linting**: ESLint with ZERO warnings policy
- **Formatting**: Prettier for consistent code style
- **Git Hooks**: Husky for pre-commit quality checks
- **IPFS**: Pinata for decentralized metadata storage

## 📁 Project Architecture & File Organization

### **Next.js App Router Structure**

```
src/app/
├── tools/                  # Tool-specific pages
│   ├── token-creator/      # SPL token creation
│   ├── burn-tokens/        # Token supply reduction
│   ├── freeze-accounts/    # Account freeze/unfreeze
│   ├── create-liquidity/   # Liquidity pool management
│   ├── revoke-mint-authority/ # Authority management
│   └── transaction-multisender/ # Batch transfers
├── account/               # Portfolio tracking
├── api/                   # API routes
│   ├── balance/
│   ├── log/
│   └── solana/
└── globals.css, layout.tsx, page.tsx
```

### **Component Organization Philosophy**

```
src/components/
├── common/        # 20+ reusable components (CHECK FIRST!)
├── pages/         # Page-specific components
│   └── [ToolName]Page/
│       ├── index.tsx           # Main page component
│       ├── [ToolName]Form/     # Form components
│       ├── FAQSection/         # Tool-specific FAQ
│       └── [toolName]Data.ts   # Static data
└── ui/           # shadcn/ui base components
```

### **Business Logic Architecture**

```
src/lib/
├── solana/       # Blockchain operations
│   ├── createToken.ts
│   ├── utils.ts
│   └── [feature].ts
├── logger/       # Centralized logging system
├── config/       # Configuration management
├── ipfs/         # IPFS metadata storage
├── toast/        # User feedback system
└── utils/        # General utilities + error handling
```

## 🚀 Core Tools & Features Understanding

### **1. Token Creator**

- Professional SPL token creation with metadata
- IPFS storage integration via Pinata
- Authority management (mint/freeze/update)
- Both Token Program and Token Extensions support

### **2. Token Burner**

- Secure supply reduction with validation
- Batch burning capabilities
- Deflationary tokenomics support

### **3. Freeze Accounts**

- Individual and batch account freezing/thawing
- Security-focused account state management
- Authority validation and permission checks

### **4. Multi-Sender**

- Batch transactions (up to 500 recipients)
- CSV import with validation
- Cost optimization with versioned transactions

### **5. Authority Management**

- Revoke mint/freeze authorities for decentralization
- Transfer ownership with security best practices
- Irreversible operations with proper warnings

### **6. Portfolio Tracker**

- Real-time balance tracking across token types
- Transaction history and analytics
- Multi-account support

## Design System & Component Architecture

### **Reusable Components First**

- **NEVER** create duplicate components - always check `components/common/` first
- Use existing components: `InfoTooltip`, `LoadingSpinner`, `ExplorerLink`, etc.
- Follow the common component pattern for consistent UI/UX
- Extend existing components rather than creating new ones

### **Available Common Components** (USE THESE FIRST!)

```
components/common/
├── AnnouncementBanner/    # Site-wide announcements
├── BenefitsSection/       # Feature benefits display
├── CustomFormField/       # Form input wrapper
├── ExplorerLink/         # Solana explorer links
├── FAQ/                  # FAQ sections
├── FeatureCard/          # Feature display cards
├── FeeBreakdown/         # Transaction fee displays
├── FileInputDropZone/    # File upload areas
├── FileUpload/           # File upload components
├── FormFields/           # Various form inputs
├── GlobalBody/           # Page body wrapper
├── GlobalFooter/         # Site footer
├── GlobalHeader/         # Site header
├── GlobalMain/           # Main content wrapper
├── InfoCard/             # Information cards
├── InfoTooltip/          # Help tooltips
├── LegalFooter/          # Legal page footer
├── LegalHeroSection/     # Legal page headers
├── LegalNoticeCard/      # Legal notice displays
├── LegalSection/         # Legal content sections
├── LoadingSpinner/       # Loading indicators
├── NotificationCard/     # Notification displays
├── RichTextRenderer/     # Rich text content
├── ServiceShowcaseSection/ # Service highlights
├── SimpleCard/           # Basic card component
├── UnifiedForm/          # Unified form wrapper
└── WalletConnectionButton/ # Wallet connect UI
```

### **Brand Guidelines & Styling**

- Strict adherence to existing color scheme and design tokens
- Use established Tailwind CSS classes and component variants
- Maintain visual consistency across all pages and features
- Follow the info/warning/destructive color patterns already established

### **Component Hierarchy**

```
components/
├── common/           # Reusable UI components (USE THESE FIRST!)
│   ├── InfoTooltip/
│   ├── LoadingSpinner/
│   ├── ExplorerLink/
│   ├── WalletConnectionButton/
│   └── ... (check existing before creating new)
├── pages/            # Page-specific components
└── ui/              # shadcn/ui base components
```

### **Documentation-Driven Development**

- **ALWAYS** reference `/docs` folder for architectural guidance
- **Primary References:**
  - System design → [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
  - How-to guides → [DEVELOPMENT.md](../docs/DEVELOPMENT.md) and [TOOLING.md](../docs/TOOLING.md)
  - Problem solving → [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)
- Use existing patterns documented in these core guides
- Reference implementation examples: Token Creator and Burn Tokens
- **Update existing docs** instead of creating new documentation files

## Code Patterns & Preferences

### **Error Handling**

- Always use the centralized error handling system in `/lib/errors/`
- Follow the simplified pattern: one `AppError` class, one `handleError()` function
- Use `getLogger()` for consistent logging
- Return proper `ApiResponseBase` types from API routes

```typescript
// ✅ GOOD: Simple error handling
import { AppError, handleError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'my-tool' })

try {
  if (!amount) {
    throw new AppError('INVALID_INPUT', 'Amount is required')
  }
  await operation()
} catch (error) {
  logger.error('Operation failed', error, { context })
  const message = handleError(error) // Pure function, no context param
  toast.error(message)
}

// ❌ BAD: Complex error handling with multiple classes
import { SolanaError, AppError, getDomainErrorMessage } from '@/lib/utils'
```

import { SolanaError, AppError, getDomainErrorMessage } from '@/lib/utils'

```

### **Solana Development**

- Support both SPL Token and Token Extensions programs
- Use versioned transactions for batch operations
- Implement proper fee estimation and user feedback
- Follow security best practices for transaction signing
- **ALWAYS use `LAMPORTS_PER_SOL` from `@solana/web3.js` for SOL/lamports conversions**
- **NEVER create custom `SOL_TO_LAMPORTS` constants - use the standard `LAMPORTS_PER_SOL`**

### **Component Structure**

```

components/pages/FeaturePage/
├── index.tsx (main page component)
├── FeatureForm/ (form components)
├── FAQSection/ (reusable FAQ - check if common/FAQSection exists first!)
└── featureData.ts (static data)

````

### **Before Creating New Components - CHECK:**

1. Does `components/common/` have what I need?
2. Can I extend an existing component?
3. Is there a similar pattern in another page component?
4. Would this be reusable across multiple pages?

### **File Naming Conventions**

- Use PascalCase for component files
- Use camelCase for utility files
- Use kebab-case for page routes
- Always include proper TypeScript types

## Documentation-First Development

### **Core Documentation Structure**

CloakForge maintains **4 focused documentation files** for maximum clarity:

1. **ARCHITECTURE.md** - System design and patterns
2. **DEVELOPMENT.md** - Setup and workflows
3. **TOOLING.md** - Tool implementation guide
4. **TROUBLESHOOTING.md** - Error handling and debugging

### **Documentation-Driven Coding Process**

1. **Check `/docs` for existing patterns** before implementing
2. **Reference documented approaches** in your implementation
3. **Update docs when changing patterns** to keep them current
4. **Use reference implementations** (Token Creator, Burn Tokens) as templates
5. **NEVER create new `.md` files** - update existing documentation instead

### **When to Update Documentation**

- Adding new architectural patterns → Update [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- Changing existing workflows → Update [DEVELOPMENT.md](../docs/DEVELOPMENT.md)
- Adding new tools or features → Update [TOOLING.md](../docs/TOOLING.md)
- Fixing bugs that reveal unclear documentation → Update [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)

### **How to Update Documentation**

1. **Identify the correct existing doc** (see list above)
2. **Update in-place** within the appropriate section
3. **Update table of contents** if adding new sections
4. **Include update date** at the top of the document
5. **Commit with clear message**: `docs: update error handling in TROUBLESHOOTING.md`

**Remember:** We have exactly **4 documentation files** for a reason - to prevent documentation sprawl and maintain clarity. If you can't fit something into one of these docs, it probably doesn't need to be documented separately.

## Brand & Design Consistency

### **Color Scheme Adherence**

- Use ONLY established color variants: `info`, `warning`, `destructive`, `secondary`
- Follow existing Tailwind class patterns throughout the codebase
- Maintain visual hierarchy established in current components

### **UI Component Standards**

- Buttons: Use existing `button` variants from `components/ui/button.tsx`
- Forms: Follow `FormField`, `FormItem`, `FormLabel` patterns
- Cards: Use established `Card` component patterns
- Icons: Use Lucide React icons consistently
- Spacing: Follow existing Tailwind spacing classes

### **Responsive Design**

- Mobile-first approach following existing patterns
- Use established breakpoint patterns
- Maintain grid and layout consistency

## Utility Function Reuse Requirements

### **MANDATORY Utility Function Usage**

**ALWAYS** use existing utility functions from `/src/lib/` before creating new ones. The library contains comprehensive utilities organized by domain:

#### **Error Handling Utilities** (`/lib/errors/`)

- `AppError` - Unified application error class with built-in user-friendly messages
- `handleError()` - Single pure function for error message extraction
- `ERROR_MESSAGES` - Centralized error message registry with 50+ codes
- `isErrorCode()` - Helper to check error types
- `getErrorCode()` - Extract error code from any error

#### **Solana Utilities** (`/lib/solana/`)

- `getSolanaPrice()` - Price fetching with caching
- `getWalletBalance()` - Balance checking with Kit integration
- `isValidSolanaAddress()` - Address validation
- `shortenAddress()` - Address formatting for display
- `lamportsToSol()` / `solToLamports()` - Unit conversions
- `createTransaction()` - Transaction building
- `fetchImage()` - Metadata image fetching
- `isRpcHealthy()` - RPC endpoint validation
- `createKitRpc()` - Kit RPC connection helper
- Token data transformers in `dataTransformers.ts`
- **ALWAYS use `LAMPORTS_PER_SOL` from `@solana/web3.js` for SOL/lamports conversions**

#### **Configuration Utilities** (`/lib/config/`)

- `getConfig()` - Environment configuration access
- `toolConfigs.ts` - Tool-specific configurations
- `feeConfigs.ts` - Centralized fee management

#### **Content Management** (`/lib/contentful/`)

- `toolConfigCache.ts` - Cached tool configuration data
- Contentful client setup and utilities

#### **Toast Notifications** (`/lib/toast/`)

- `showTransactionToast()` - Unified transaction feedback with explorer link
- `showTokenCreationToast()` - Specialized token creation success with transaction and token links

#### **General Utilities** (`/lib/utils.ts`)

- Core utility functions and helpers
- Wallet utilities in `/lib/utils/walletUtils.ts`

### **Utility Discovery Process**

Before implementing ANY utility function:

1. **Check `/lib/` directory structure** for existing implementations
2. **Search by functionality** using `grep_search` or `semantic_search`
3. **Examine similar features** in the codebase for patterns
4. **Extend existing utilities** rather than creating duplicates

### **Integration Requirements**

- **Error Handling**: MUST use `handleError()` for all error message extraction
- **Solana Operations**: MUST use existing Solana utility functions
- **Configuration**: MUST use `getConfig()` for environment settings
- **Logging**: MUST use `getLogger()` from logger utilities
- **Price Data**: MUST use `getSolanaPrice()` from price cache
- **Address Operations**: MUST use existing address utilities

## Anti-Patterns & Code Quality Rules

### **NEVER Do:**

- Create duplicate components without checking `components/common/` **(violates DRY)**
- Create duplicate utility functions without checking `/lib/` directory **(violates DRY)**
- Implement custom error handling (use existing error utilities) **(violates Clear Purpose)**
- Introduce custom styling that breaks brand consistency **(violates Maintainability)**
- Create new error handling patterns (use documented strategy) **(violates KISS)**
- Add new logging approaches (use established `getLogger` pattern) **(violates KISS)**
- Ignore existing component composition patterns **(violates Developer-First)**
- Build custom Solana utilities when existing ones are available **(violates DRY)**
- Create custom SOL/lamports conversion constants (use `LAMPORTS_PER_SOL` from `@solana/web3.js`) **(violates DRY)**
- Over-engineer solutions for simple problems **(violates KISS)**
- **Create new `.md` documentation files** **(violates KISS & Maintainability)**

### **ALWAYS Do:**

- Check for existing reusable components first **(DRY principle)**
- **Discover and reuse existing utility functions from `/lib/` directory** **(DRY principle)**
- **Use `semantic_search` or `grep_search` to find existing utilities** **(Developer-First)**
- Follow documented architectural patterns **(Maintainability)**
- Maintain brand color and spacing consistency **(Clear Purpose)**
- Use TypeScript strictly and follow existing patterns **(Developer-First)**
- **Extend existing utilities rather than creating duplicates** **(DRY principle)**
- Leverage existing common components for consistency **(KISS principle)**
- Ask yourself: "Is this the simplest solution?" **(KISS principle)**
- Write code that explains itself **(Clear Purpose)**
- **Update existing documentation instead of creating new files** **(KISS & Maintainability)**

## 🎯 Core Development Principles

CloakForge follows these fundamental principles for **clean, maintainable code**:

### **1. KISS - Keep It Simple, Stupid**

- Simple code is robust code; complexity is fragile
- Avoid over-engineering and premature abstractions
- Clarity over cleverness - code should read like a story
- If you can't explain it simply, refactor it
- **Maintain 4 focused docs instead of 10+ scattered files**

### **2. DRY - Don't Repeat Yourself**

- Reuse existing components and utilities (check `/src/components/common/` and `/src/lib/` first)
- Abstract common patterns when used 3+ times
- Single source of truth for business logic
- Share code between similar tools
- **Single source of truth for documentation - update existing docs, don't create new ones**
- Single source of truth for business logic
- Share code between similar tools

### **3. Clear Purpose**

- Every file, function, and component has ONE clear responsibility
- Name things for what they DO, not what they ARE
- Functions should be small and focused (< 50 lines ideally)
- Comments explain WHY, code explains HOW
- **Each documentation file has a clear, focused purpose**

### **4. Developer-First**

- Code is read 10x more than written - optimize for readability
- Consistent patterns reduce cognitive load
- Comprehensive error messages that help debugging
- Self-documenting code with clear variable names
- **Easy-to-navigate documentation with clear structure**

### **5. Maintainability**

- Future developers (including yourself) will thank you
- No magic numbers or hidden dependencies
- Explicit is better than implicit
- Easy to change, easy to test, easy to understand
- **Maintain clean documentation structure - 4 docs, not 10+**

**Remember**: These principles directly address the project's past over-engineering issues. When in doubt, choose simplicity.

---

## 🛡️ Security & Privacy Standards

### **Privacy-First Development**

- **NEVER** implement any data collection or tracking
- **NEVER** store user data server-side
- All processing must be client-side
- No analytics, cookies, or user identification
- Self-custody principles - users control their wallets completely

### **Security Implementation Requirements**

- Hardware wallet integration support (Ledger, etc.)
- Multi-signature transaction support
- Comprehensive input validation and sanitization
- Secure transaction signing practices
- Audit-friendly code patterns

### **Blockchain Security Patterns**

- Always validate Solana addresses before operations
- Implement proper authority checks for token operations
- Use simulation before actual transaction submission
- Proper error handling for failed transactions
- Clear user warnings for irreversible operations

## ⚡ Performance & Optimization Standards

### **Solana-Specific Optimizations**

- Use versioned transactions for batch operations
- Implement address lookup tables for large transaction sets
- Optimize RPC calls with batching where possible
- Proper fee estimation and user feedback
- Rate limiting compliance for RPC endpoints

### **Frontend Performance**

- Lazy loading for heavy components
- Optimistic UI updates where appropriate
- Proper loading states and error boundaries
- Minimize re-renders with proper React patterns
- Efficient state management with Zustand and React Query

## 🎨 User Experience Guidelines

### **Professional UX Standards**

- Clear, informative loading states with progress indicators
- Comprehensive error messages with actionable guidance
- Transaction confirmation flows with fee breakdowns
- Success states with transaction explorer links
- Mobile-first responsive design

### **Accessibility Requirements**

- WCAG 2.1 AA compliance
- Proper semantic HTML structure
- Keyboard navigation support

## 🔍 Development Workflow & Standards

### **Code Quality Non-Negotiables**

- **ZERO ESLint warnings** policy (use `npm run lint:nowarn`)
- Strict TypeScript with proper type definitions
- Prettier formatting compliance
- Pre-commit hooks validation via Husky
- Comprehensive error handling using documented patterns

### **Testing & Validation Standards**

- Test on devnet before mainnet implementations
- Validate all user inputs with Zod schemas
- Implement proper error boundaries
- Test with different wallet types
- Performance testing for batch operations

### **Git & Development Practices**

- Feature branch workflow
- Descriptive commit messages

## 🧠 Advanced Implementation Patterns

### **React Query (TanStack Query) Patterns**

- Use established query patterns in `hooks/queries/`
- Implement optimistic updates for better UX
- Proper error handling with retry logic
- Cache invalidation strategies
- Background refetching for real-time data

### **Zustand State Management**

- Minimal global state - prefer React Query for server state
- Clear state structure and actions
- Proper TypeScript integration
- Avoid state duplication

### **Form Handling Excellence**

- React Hook Form + Zod validation throughout
- Consistent error display patterns
- Proper form submission states
- Client-side validation with server-side verification

### **Solana Integration Patterns**

- Connection management and RPC endpoint handling
- Proper wallet adapter integration
- Transaction lifecycle management
- Error parsing and user-friendly messages
- Network detection and switching

## 🎯 Feature Development Guidelines

### **Adding New Tools Checklist**

1. **Plan**: Check if similar functionality exists
2. **Structure**: Follow the established page component pattern (see [TOOLING.md](../docs/TOOLING.md))
3. **Components**: Use existing common components (check `/src/components/common/` first!)
4. **Forms**: Implement with React Hook Form + Zod
5. **State**: Use React Query for server state
6. **Styling**: Follow design system strictly
7. **Testing**: Validate on devnet first
8. **Security**: Review for privacy/security compliance
9. **Performance**: Optimize for mobile and slow connections
10. **Documentation**: Update existing docs ([TOOLING.md](../docs/TOOLING.md)) if introducing new patterns - **DO NOT create new `.md` files**

### **API Route Development**

- Follow established error response patterns (see [TOOLING.md](../docs/TOOLING.md))
- Implement proper logging with context
- Use TypeScript for request/response types
- Validate inputs with Zod schemas
- Return consistent response structures
- Reference Token Creator implementation as template

## 💡 Optimal Prompting Strategies for Complex Features

### **Effective Request Patterns**

```markdown
# ✅ GOOD: Specific, context-aware requests

"Implement batch token freezing following the FreezeAccountsPage pattern,
using existing FeeBreakdown and InfoTooltip components, with proper error
handling from our documented strategy, supporting both Token Program and
Token Extensions, and including comprehensive user feedback."

# ❌ AVOID: Vague requests

"Make a batch freeze feature"
"Add error handling"
"Improve the UI"
````

### **Request Context Hierarchy** (Include in this order)

1. **Feature Goal**: What specific functionality is needed
2. **Existing Patterns**: Reference similar existing implementations
3. **Component Reuse**: Specify which common components to use
4. **Technical Requirements**: Solana programs, transaction types, etc.
5. **UX Requirements**: Loading states, error handling, accessibility

### **Multi-Step Feature Development**

Break complex features into phases:

1. **"Create the basic component structure and routing"**
2. **"Add form validation and state management"**
3. **"Implement Solana transaction logic with proper error handling"**
4. **"Add comprehensive user feedback and edge case handling"**

## 🤖 Enhanced MCP Integration Strategies

### **Solana Expert Consultation Patterns**

```markdown
# Use MCP for:

- Complex blockchain operation guidance
- Latest Solana best practices
- Transaction optimization strategies
- Security pattern validation
- Error handling for specific Solana errors
```

### **Documentation Search Integration**

```markdown
# Leverage MCP to:

- Find implementation examples from Solana docs
- Research Token Extensions capabilities
- Discover batch operation optimizations
- Validate architectural decisions
```

### **Expert Question Formulation**

```markdown
# Instead of: "How do I freeze accounts?"

# Ask: "What are the best practices for implementing batch token account

# freezing in a production Solana application, considering transaction

# size limits, user experience, error handling, and support for both

# Token Program and Token Extensions?"
```

## 🎯 Context-Aware Development Requests

### **Component Development**

```markdown
"Following the established CloakForge component patterns in
components/pages/[Tool]Page/, create a [FeatureName] component that:

- Uses existing common components like InfoTooltip and FeeBreakdown
- Follows the info color scheme for informational displays
- Implements proper TypeScript types and Zod validation
- Includes comprehensive error handling per our documented strategy
- Supports both SPL Token and Token Extensions programs"
```

### **API Development**

```markdown
"Create an API route for [feature] that follows our established patterns:

- Returns proper ApiResponseBase types
- Uses getLogger for consistent logging
- Validates inputs with Zod schemas
- Handles Solana-specific errors with proper error codes
- Maintains privacy-first principles with no data storage"
```

## 🏆 CloakForge-Specific Excellence Standards

### **Brand Positioning Context**

- **"Ultimate Solana Token Management Suite"** - Every feature should reflect professional-grade quality
- **"Lowest Fees"** - Always optimize for cost efficiency
- **"Lightning Fast"** - Performance is critical
- **"Enterprise Security"** - Security cannot be compromised
- **"Developer Friendly"** - Code must be maintainable and well-documented

### **Competitive Advantages to Maintain**

- Zero hidden costs and transparent pricing
- Mobile optimization for global access
- Comprehensive API coverage
- Open source transparency
- Active community support

### **Feature Consistency Standards**

Every tool should include:

- Clear fee breakdown with cost optimization
- Devnet testing capability
- Comprehensive FAQ section
- Mobile-responsive design
- Hardware wallet compatibility
- Batch operation support where applicable

## 🚀 Advanced Copilot Collaboration Tips

### **Multi-File Context Awareness**

When working on features, keep these files open for context:

- Related page components
- Common components being used
- Error handling utilities
- Type definitions
- Documentation files
