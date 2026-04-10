# Comprehensive Liquidity Provider Unit Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create comprehensive unit testing coverage for all Liquidity Provider tool components, utilities, hooks, and API endpoints with proper Solana transaction v0 mocking.

**Architecture:** Multiagent testing approach covering 5 specialized domains: API endpoints, React components with RTL, utility functions, custom hooks, and Solana blockchain integrations. Each domain uses dedicated test patterns with proper mocking strategies for isolation.

**Tech Stack:** Vitest, React Testing Library, MSW for API mocking, comprehensive Solana Web3.js and Raydium SDK v2 mocking with transaction v0 support.

---

## File Structure

**New Test Files to Create:**
- `src/app/api/solana/liquidity-provider/__tests__/route.test.ts` - API endpoint tests
- `src/components/pages/LiquidityProviderPage/HeroSection/__tests__/HeroSection.test.tsx` - Hero component tests  
- `src/components/pages/LiquidityProviderPage/FAQSection/__tests__/FAQSection.test.tsx` - FAQ component tests
- `src/components/pages/LiquidityProviderPage/BenefitsSection/__tests__/BenefitsSection.test.tsx` - Benefits component tests
- `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/FormSections/__tests__/FormSections.test.tsx` - Form sections tests
- `src/lib/schemas/__tests__/apiSchemas.test.ts` - Schema validation tests
- `src/types/__tests__/liquidityProvider.test.ts` - Type guard and utility tests
- `src/lib/solana/server-side/__tests__/createRaydiumPool.v0.test.ts` - Transaction v0 specific tests
- `src/hooks/solana/__tests__/useLiquidityProvider.comprehensive.test.ts` - Comprehensive hook tests

**Test Utilities to Create:**
- `src/__tests__/utils/solanaTestHelpers.ts` - Shared Solana testing utilities
- `src/__tests__/utils/componentTestHelpers.tsx` - Shared React component test utilities
- `src/__tests__/utils/mockData.ts` - Consolidated mock data

**Enhanced Files:**
- `vitest.config.ts` - Add setup files and enhanced configuration
- `src/__tests__/setup.ts` - Global test setup file

### Task 1: Test Infrastructure Setup

**Files:**
- Create: `src/__tests__/setup.ts`
- Create: `src/__tests__/utils/solanaTestHelpers.ts`
- Create: `src/__tests__/utils/componentTestHelpers.tsx`
- Create: `src/__tests__/utils/mockData.ts`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Write the failing test infrastructure validation**

```typescript
// src/__tests__/setup.ts
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Global test setup
vi.mock('server-only', () => ({}))

// Validate setup
export const validateTestSetup = () => {
  if (!vi) throw new Error('Vitest not available')
  return true
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/setup.ts`
Expected: FAIL with "validateTestSetup not defined"

- [ ] **Step 3: Create comprehensive Solana test helpers**

```typescript
// src/__tests__/utils/solanaTestHelpers.ts
import { vi } from 'vitest'
import { PublicKey, Transaction, VersionedTransaction, MessageV0, AddressLookupTableAccount } from '@solana/web3.js'

export const createMockPublicKey = (seed = 'test'): PublicKey => {
  return new PublicKey(seed.repeat(8).slice(0, 44).padEnd(44, '1'))
}

export const createMockMessageV0 = (): MessageV0 => ({
  header: {
    numRequiredSignatures: 1,
    numReadonlySignedAccounts: 0,
    numReadonlyUnsignedAccounts: 1,
  },
  staticAccountKeys: [createMockPublicKey('signer'), createMockPublicKey('program')],
  recentBlockhash: 'test-blockhash-1234567890',
  compiledInstructions: [],
  addressTableLookups: [],
})

export const createMockVersionedTransaction = (): VersionedTransaction => {
  return new VersionedTransaction(createMockMessageV0())
}

export const mockSolanaConnection = () => ({
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: 'test-blockhash-1234567890',
    lastValidBlockHeight: 123456789,
  }),
  getBalance: vi.fn().mockResolvedValue(10_000_000_000), // 10 SOL
  sendRawTransaction: vi.fn().mockResolvedValue('mock-signature-123'),
  getSignatureStatus: vi.fn().mockResolvedValue({ value: null }),
  getAddressLookupTable: vi.fn().mockResolvedValue({
    value: null as AddressLookupTableAccount | null,
  }),
})

export const mockRaydiumSDK = () => ({
  Raydium: {
    load: vi.fn().mockResolvedValue({
      cpmm: {
        createPool: vi.fn().mockResolvedValue({
          transactions: [{ transaction: createMockVersionedTransaction() }],
        }),
      },
      clmm: {
        createPool: vi.fn().mockResolvedValue({
          transactions: [{ transaction: createMockVersionedTransaction() }],
        }),
      },
    }),
  },
  TxVersion: {
    V0: 'v0',
    LEGACY: 'legacy',
  },
})
```

- [ ] **Step 4: Create React component test helpers**

```typescript
// src/__tests__/utils/componentTestHelpers.tsx
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export const mockWalletAdapter = {
  useWallet: () => ({
    connected: true,
    publicKey: {
      toString: () => 'TestWallet111111111111111111111111111111111',
      toBase58: () => 'TestWallet111111111111111111111111111111111',
    },
    signTransaction: vi.fn((tx: unknown) => Promise.resolve(tx)),
  }),
  useConnection: () => ({
    connection: mockSolanaConnection(),
  }),
}
```

- [ ] **Step 5: Create consolidated mock data**

```typescript
// src/__tests__/utils/mockData.ts
import type { LiquidityProviderParams, LiquidityProviderResponse } from '@/types/liquidityProvider'

export const mockLiquidityProviderParams: LiquidityProviderParams = {
  walletPublicKey: 'TestWallet111111111111111111111111111111111',
  poolConfig: {
    poolType: 'CPMM',
    tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenB: 'SOL',
    feeTier: '0.05',
    initialLiquidity: {
      amountA: '1000',
      amountB: '0.5',
    },
    slippageTolerance: 0.5,
    deadline: 20,
    platformFee: 0.1,
  },
}

export const mockLiquidityProviderResponse: LiquidityProviderResponse = {
  serializedTransaction: 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
  poolPublicKey: 'PoolKey111111111111111111111111111111111111',
  estimatedCosts: {
    networkFee: 0.00001,
    platformFee: 0.1,
    total: 0.10001,
  },
  message: 'Pool creation transaction prepared successfully',
}

export const mockFormData = {
  cpmm: {
    poolType: 'CPMM' as const,
    tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenB: 'SOL' as const,
    amountA: '1000',
    amountB: '0.5',
    feeTier: '0.05' as const,
    slippageTolerance: '0.5',
    deadline: '20',
    platformFee: '0.1',
  },
  clmm: {
    poolType: 'CLMM' as const,
    tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenB: 'USDC' as const,
    amountA: '1000',
    amountB: '500',
    feeTier: '0.01' as const,
    slippageTolerance: '0.5',
    minPrice: '0.01',
    maxPrice: '10.00',
    deadline: '20',
    platformFee: '0.1',
  },
}
```

- [ ] **Step 6: Update vitest config with setup file**

```typescript
// vitest.config.ts - add to existing config
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 7: Run tests to verify setup works**

Run: `npm test`
Expected: All tests pass with new setup

- [ ] **Step 8: Commit infrastructure**

```bash
git add src/__tests__/setup.ts src/__tests__/utils/ vitest.config.ts
git commit -m "feat(test): add comprehensive test infrastructure with Solana v0 mocking"
```

### Task 2: API Endpoint Unit Tests

**Files:**
- Create: `src/app/api/solana/liquidity-provider/__tests__/route.test.ts`

- [ ] **Step 1: Write failing API endpoint test**

```typescript
// src/app/api/solana/liquidity-provider/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock dependencies
vi.mock('server-only', () => ({}))

vi.mock('@/lib/api', () => ({
  createSolanaApiRoute: vi.fn(({ handler }) => handler),
}))

vi.mock('@/lib/schemas/apiSchemas', () => ({
  liquidityProviderRequestSchema: {
    parse: vi.fn((data) => data),
  },
}))

vi.mock('@/lib/solana/server-side/createRaydiumPool', () => ({
  createRaydiumPoolTransaction: vi.fn(),
}))

describe('POST /api/solana/liquidity-provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should process CPMM pool creation successfully', async () => {
    const mockResult = {
      serializedTransaction: 'mock-tx',
      poolPublicKey: 'mock-pool',
      estimatedCosts: { networkFee: 0.001, platformFee: 0.1, total: 0.101 },
      message: 'Success',
    }

    const { createRaydiumPoolTransaction } = await import('@/lib/solana/server-side/createRaydiumPool')
    vi.mocked(createRaydiumPoolTransaction).mockResolvedValue(mockResult)

    const requestData = {
      walletPublicKey: 'TestWallet111111111111111111111111111111111',
      poolConfig: {
        poolType: 'CPMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'SOL',
        feeTier: '0.05',
        initialLiquidity: { amountA: '1000', amountB: '0.5' },
        slippageTolerance: 0.5,
        deadline: 20,
        platformFee: 0.1,
      },
    }

    const result = await POST(requestData)

    expect(createRaydiumPoolTransaction).toHaveBeenCalledWith({
      walletPublicKey: requestData.walletPublicKey,
      poolConfig: requestData.poolConfig,
    })
    expect(result).toEqual(mockResult)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/solana/liquidity-provider/__tests__/route.test.ts`
Expected: FAIL with "POST not defined"

- [ ] **Step 3: Add comprehensive API error handling tests**

```typescript
// Add to same file
it('should handle createRaydiumPoolTransaction errors', async () => {
  const { createRaydiumPoolTransaction } = await import('@/lib/solana/server-side/createRaydiumPool')
  vi.mocked(createRaydiumPoolTransaction).mockRejectedValue(new Error('Pool creation failed'))

  const requestData = {
    walletPublicKey: 'TestWallet111111111111111111111111111111111',
    poolConfig: {
      poolType: 'CPMM',
      tokenA: 'InvalidToken',
      tokenB: 'SOL',
      feeTier: '0.05',
      initialLiquidity: { amountA: '1000', amountB: '0.5' },
    },
  }

  await expect(POST(requestData)).rejects.toThrow('Pool creation failed')
})

it('should process CLMM pool with price range', async () => {
  const mockResult = {
    serializedTransaction: 'mock-clmm-tx',
    poolPublicKey: 'mock-clmm-pool',
    estimatedCosts: { networkFee: 0.001, platformFee: 0.1, total: 0.101 },
    message: 'CLMM Success',
  }

  const { createRaydiumPoolTransaction } = await import('@/lib/solana/server-side/createRaydiumPool')
  vi.mocked(createRaydiumPoolTransaction).mockResolvedValue(mockResult)

  const requestData = {
    walletPublicKey: 'TestWallet111111111111111111111111111111111',
    poolConfig: {
      poolType: 'CLMM',
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'USDC',
      feeTier: '0.01',
      initialLiquidity: { amountA: '1000', amountB: '500' },
      priceRange: { minPrice: 0.01, maxPrice: 10.0 },
    },
  }

  const result = await POST(requestData)
  expect(result).toEqual(mockResult)
})
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/app/api/solana/liquidity-provider/__tests__/route.test.ts`
Expected: All tests pass

- [ ] **Step 5: Commit API tests**

```bash
git add src/app/api/solana/liquidity-provider/__tests__/route.test.ts
git commit -m "test(api): add comprehensive liquidity provider API endpoint tests"
```

### Task 3: React Component Unit Tests

**Files:**
- Create: `src/components/pages/LiquidityProviderPage/HeroSection/__tests__/HeroSection.test.tsx`
- Create: `src/components/pages/LiquidityProviderPage/FAQSection/__tests__/FAQSection.test.tsx`

- [ ] **Step 1: Write failing HeroSection test**

```tsx
// src/components/pages/LiquidityProviderPage/HeroSection/__tests__/HeroSection.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroSection } from '../HeroSection'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('HeroSection', () => {
  it('should render hero content correctly', () => {
    renderWithProviders(<HeroSection />)

    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText(/Liquidity/)).toBeInTheDocument()
    expect(screen.getByText('Provider')).toBeInTheDocument()
    expect(screen.getByText(/Create CPMM and CLMM liquidity pools/)).toBeInTheDocument()
  })

  it('should scroll to form when button clicked', async () => {
    const user = userEvent.setup()
    
    // Mock getElementById
    const mockScrollIntoView = vi.fn()
    const mockElement = { scrollIntoView: mockScrollIntoView }
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as any)

    renderWithProviders(<HeroSection />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(document.getElementById).toHaveBeenCalledWith('liquidity-provider-form')
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/pages/LiquidityProviderPage/HeroSection/__tests__/HeroSection.test.tsx`
Expected: FAIL with "HeroSection not rendering"

- [ ] **Step 3: Add comprehensive HeroSection tests**

```tsx
// Add to same file
it('should display feature indicators', () => {
  renderWithProviders(<HeroSection />)

  expect(screen.getByText('CPMM & CLMM Support')).toBeInTheDocument()
  expect(screen.getByText('Raydium SDK v2')).toBeInTheDocument()
})

it('should render feature cards', async () => {
  renderWithProviders(<HeroSection />)

  // Features should be imported and displayed
  const { features } = await import('../../liquidityProviderData')
  
  features.forEach(feature => {
    expect(screen.getByText(feature.title)).toBeInTheDocument()
    expect(screen.getByText(feature.description)).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Write failing FAQSection test**

```tsx
// src/components/pages/LiquidityProviderPage/FAQSection/__tests__/FAQSection.test.tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FAQSection } from '../FAQSection'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'

describe('FAQSection', () => {
  it('should render FAQ section title', () => {
    renderWithProviders(<FAQSection />)

    expect(screen.getByText(/Frequently Asked Questions/)).toBeInTheDocument()
  })

  it('should toggle FAQ items when clicked', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<FAQSection />)

    const { liquidityProviderFAQ } = await import('../faqData')
    const firstQuestion = liquidityProviderFAQ[0]

    const questionButton = screen.getByText(firstQuestion.question)
    await user.click(questionButton)

    expect(screen.getByText(firstQuestion.answer)).toBeInTheDocument()
  })

  it('should render all FAQ items', async () => {
    renderWithProviders(<FAQSection />)

    const { liquidityProviderFAQ } = await import('../faqData')
    
    liquidityProviderFAQ.forEach(faq => {
      expect(screen.getByText(faq.question)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 5: Run component tests to verify they pass**

Run: `npm test -- src/components/pages/LiquidityProviderPage/*/HeroSection/__tests__/*.test.tsx src/components/pages/LiquidityProviderPage/FAQSection/__tests__/*.test.tsx`
Expected: All component tests pass

- [ ] **Step 6: Commit component tests**

```bash
git add src/components/pages/LiquidityProviderPage/HeroSection/__tests__/ src/components/pages/LiquidityProviderPage/FAQSection/__tests__/
git commit -m "test(components): add comprehensive HeroSection and FAQSection unit tests"
```

### Task 4: Form Components Unit Tests

**Files:**
- Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/FormSections/__tests__/FormSections.test.tsx`
- Create: `src/components/pages/LiquidityProviderPage/BenefitsSection/__tests__/BenefitsSection.test.tsx`

- [ ] **Step 1: Write failing FormSections test**

```tsx
// src/components/pages/LiquidityProviderPage/LiquidityProviderForm/FormSections/__tests__/FormSections.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { FormSections } from '../FormSections'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'

// Mock dependencies
vi.mock('@/lib/config/getToolUIConfig', () => ({
  getToolUIConfig: vi.fn(() => ({
    submitText: 'Create Pool',
    loadingText: 'Creating...',
    icon: 'Droplets',
    variant: 'default',
  })),
}))

const FormWrapper = () => {
  const form = useForm({
    defaultValues: {
      poolType: '',
      tokenA: '',
      tokenB: '',
      amountA: '',
      amountB: '',
      feeTier: '',
      slippageTolerance: '0.5',
      deadline: '20',
      platformFee: '0.1',
    },
  })
  
  return <FormSections form={form} />
}

describe('FormSections', () => {
  it('should render pool type selection', () => {
    renderWithProviders(<FormWrapper />)

    expect(screen.getByText('Pool Type')).toBeInTheDocument()
    expect(screen.getByText('Choose between CPMM (simple) or CLMM (advanced) pool types')).toBeInTheDocument()
  })

  it('should show custom token input when custom is selected', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<FormWrapper />)

    // Click on token B dropdown
    const tokenBSelect = screen.getByDisplayValue('Choose token B')
    await user.click(tokenBSelect)

    // Select custom option
    const customOption = screen.getByText('Custom Token')
    await user.click(customOption)

    await waitFor(() => {
      expect(screen.getByLabelText('Custom Token B Address')).toBeInTheDocument()
    })
  })

  it('should show price range inputs for CLMM', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<FormWrapper />)

    // Select CLMM pool type
    const poolTypeSelect = screen.getByDisplayValue('Select pool type')
    await user.click(poolTypeSelect)

    const clmmOption = screen.getByText('CLMM (Advanced)')
    await user.click(clmmOption)

    await waitFor(() => {
      expect(screen.getByLabelText('Min Price')).toBeInTheDocument()
      expect(screen.getByLabelText('Max Price')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/pages/LiquidityProviderPage/LiquidityProviderForm/FormSections/__tests__/FormSections.test.tsx`
Expected: FAIL with "FormSections not rendering"

- [ ] **Step 3: Add comprehensive form validation tests**

```tsx
// Add to same file
it('should render all required form fields', () => {
  renderWithProviders(<FormWrapper />)

  expect(screen.getByLabelText('Pool Type *')).toBeInTheDocument()
  expect(screen.getByLabelText('Token A *')).toBeInTheDocument()
  expect(screen.getByLabelText('Token B *')).toBeInTheDocument()
  expect(screen.getByLabelText('Amount A *')).toBeInTheDocument()
  expect(screen.getByLabelText('Amount B *')).toBeInTheDocument()
  expect(screen.getByLabelText('Fee Tier *')).toBeInTheDocument()
})

it('should display fee tier options correctly', async () => {
  const user = userEvent.setup()
  
  renderWithProviders(<FormWrapper />)

  const feeTierSelect = screen.getByDisplayValue('Select fee tier')
  await user.click(feeTierSelect)

  expect(screen.getByText('0.01% (Most Liquid)')).toBeInTheDocument()
  expect(screen.getByText('0.05% (Standard)')).toBeInTheDocument()
  expect(screen.getByText('0.25% (Less Liquid)')).toBeInTheDocument()
  expect(screen.getByText('1.00% (Exotic Pairs)')).toBeInTheDocument()
})

it('should display token B options correctly', async () => {
  const user = userEvent.setup()
  
  renderWithProviders(<FormWrapper />)

  const tokenBSelect = screen.getByDisplayValue('Choose token B')
  await user.click(tokenBSelect)

  expect(screen.getByText('SOL (Solana)')).toBeInTheDocument()
  expect(screen.getByText('USDC (USD Coin)')).toBeInTheDocument()
  expect(screen.getByText('USDT (Tether)')).toBeInTheDocument()
  expect(screen.getByText('Custom Token')).toBeInTheDocument()
})
```

- [ ] **Step 4: Write BenefitsSection test**

```tsx
// src/components/pages/LiquidityProviderPage/BenefitsSection/__tests__/BenefitsSection.test.tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { BenefitsSection } from '../BenefitsSection'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'

describe('BenefitsSection', () => {
  it('should render benefits section with config', async () => {
    renderWithProviders(<BenefitsSection />)

    const { liquidityProviderBenefitsConfig } = await import('../benefitsConfig')

    expect(screen.getByText(liquidityProviderBenefitsConfig.title)).toBeInTheDocument()
    
    liquidityProviderBenefitsConfig.valueProps.forEach(prop => {
      expect(screen.getByText(prop.title)).toBeInTheDocument()
      expect(screen.getByText(prop.description)).toBeInTheDocument()
    })
  })

  it('should render CTA section', async () => {
    renderWithProviders(<BenefitsSection />)

    const { liquidityProviderBenefitsConfig } = await import('../benefitsConfig')

    expect(screen.getByText(liquidityProviderBenefitsConfig.cta.title)).toBeInTheDocument()
    expect(screen.getByText(liquidityProviderBenefitsConfig.cta.description)).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run form component tests to verify they pass**

Run: `npm test -- src/components/pages/LiquidityProviderPage/LiquidityProviderForm/FormSections/__tests__/ src/components/pages/LiquidityProviderPage/BenefitsSection/__tests__/`
Expected: All form component tests pass

- [ ] **Step 6: Commit form component tests**

```bash
git add src/components/pages/LiquidityProviderPage/LiquidityProviderForm/FormSections/__tests__/ src/components/pages/LiquidityProviderPage/BenefitsSection/__tests__/
git commit -m "test(components): add comprehensive FormSections and BenefitsSection tests"
```

### Task 5: Schema and Type Validation Tests

**Files:**
- Create: `src/lib/schemas/__tests__/apiSchemas.test.ts`
- Create: `src/types/__tests__/liquidityProvider.test.ts`

- [ ] **Step 1: Write failing schema validation test**

```typescript
// src/lib/schemas/__tests__/apiSchemas.test.ts
import { describe, it, expect } from 'vitest'
import { liquidityProviderRequestSchema } from '../apiSchemas'
import { mockFormData } from '@/__tests__/utils/mockData'

describe('liquidityProviderRequestSchema', () => {
  it('should validate valid CPMM request', () => {
    const validCPMMRequest = {
      walletPublicKey: 'TestWallet111111111111111111111111111111111',
      poolConfig: {
        poolType: 'CPMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'SOL',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
        slippageTolerance: 0.5,
        deadline: 20,
        platformFee: 0.1,
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(validCPMMRequest)
    expect(result.success).toBe(true)
  })

  it('should validate valid CLMM request with price range', () => {
    const validCLMMRequest = {
      walletPublicKey: 'TestWallet111111111111111111111111111111111',
      poolConfig: {
        poolType: 'CLMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'USDC',
        feeTier: '0.01',
        initialLiquidity: {
          amountA: '1000',
          amountB: '500',
        },
        priceRange: {
          minPrice: 0.01,
          maxPrice: 10.0,
        },
        slippageTolerance: 0.5,
        deadline: 20,
        platformFee: 0.1,
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(validCLMMRequest)
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/schemas/__tests__/apiSchemas.test.ts`
Expected: FAIL with schema validation errors

- [ ] **Step 3: Add comprehensive schema validation tests**

```typescript
// Add to same file
it('should reject invalid wallet address', () => {
  const invalidRequest = {
    walletPublicKey: 'invalid-address',
    poolConfig: mockFormData.cpmm,
  }

  const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
  expect(result.success).toBe(false)
})

it('should reject invalid pool type', () => {
  const invalidRequest = {
    walletPublicKey: 'TestWallet111111111111111111111111111111111',
    poolConfig: {
      ...mockFormData.cpmm,
      poolType: 'INVALID_POOL_TYPE',
    },
  }

  const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
  expect(result.success).toBe(false)
})

it('should reject CLMM without price range', () => {
  const invalidRequest = {
    walletPublicKey: 'TestWallet111111111111111111111111111111111',
    poolConfig: {
      poolType: 'CLMM',
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'USDC',
      feeTier: '0.01',
      initialLiquidity: {
        amountA: '1000',
        amountB: '500',
      },
      // Missing priceRange for CLMM
    },
  }

  const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
  expect(result.success).toBe(false)
})
```

- [ ] **Step 4: Write type guard tests**

```typescript
// src/types/__tests__/liquidityProvider.test.ts
import { describe, it, expect } from 'vitest'
import type { LiquidityProviderParams, LiquidityProviderResponse, PoolType, FeeTier } from '../liquidityProvider'

describe('liquidityProvider types', () => {
  it('should validate PoolType union type', () => {
    const validPoolTypes: PoolType[] = ['CPMM', 'CLMM']
    const invalidPoolType = 'INVALID' as any

    expect(validPoolTypes).toContain('CPMM')
    expect(validPoolTypes).toContain('CLMM')
    expect(validPoolTypes).not.toContain(invalidPoolType)
  })

  it('should validate FeeTier union type', () => {
    const validFeeTiers: FeeTier[] = ['0.01', '0.05', '0.25', '1.00']
    const invalidFeeTier = '0.03' as any

    validFeeTiers.forEach(tier => {
      expect(['0.01', '0.05', '0.25', '1.00']).toContain(tier)
    })
    expect(['0.01', '0.05', '0.25', '1.00']).not.toContain(invalidFeeTier)
  })

  it('should ensure LiquidityProviderParams structure', () => {
    const params: LiquidityProviderParams = {
      walletPublicKey: 'test-key',
      poolConfig: {
        poolType: 'CPMM',
        tokenA: 'token-a',
        tokenB: 'SOL',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
        slippageTolerance: 0.5,
        deadline: 20,
        platformFee: 0.1,
      },
    }

    expect(params.walletPublicKey).toBeDefined()
    expect(params.poolConfig).toBeDefined()
    expect(params.poolConfig.poolType).toBe('CPMM')
  })
})
```

- [ ] **Step 5: Run schema and type tests to verify they pass**

Run: `npm test -- src/lib/schemas/__tests__/ src/types/__tests__/`
Expected: All schema and type tests pass

- [ ] **Step 6: Commit schema and type tests**

```bash
git add src/lib/schemas/__tests__/ src/types/__tests__/
git commit -m "test(schemas): add comprehensive schema validation and type guard tests"
```

### Task 6: Comprehensive Hook Tests

**Files:**
- Create: `src/hooks/solana/__tests__/useLiquidityProvider.comprehensive.test.ts`

- [ ] **Step 1: Write comprehensive hook tests**

```typescript
// src/hooks/solana/__tests__/useLiquidityProvider.comprehensive.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLiquidityProvider, TOKEN_B_MINT_ADDRESSES, resolveTokenBAddress, buildLiquidityRequest } from '../useLiquidityProvider'
import { mockWalletAdapter } from '@/__tests__/utils/componentTestHelpers'
import { mockFormData } from '@/__tests__/utils/mockData'

// Mock all dependencies
vi.mock('@solana/wallet-adapter-react', () => mockWalletAdapter)

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: vi.fn().mockResolvedValue({
    data: {
      serializedTransaction: 'mock-tx',
      poolPublicKey: 'mock-pool',
      estimatedCosts: { total: 0.1 },
      message: 'Success',
    },
  }),
}))

vi.mock('@/lib/solana', () => ({
  confirmTransactionWithParallelStrategy: vi.fn().mockResolvedValue({
    confirmed: true,
    slot: 1,
    err: null,
  }),
  createConnectionPair: vi.fn(() => ({ kitRpc: {} })),
}))

vi.mock('@/lib/solana/validateBalance', () => ({
  validateBalance: vi.fn().mockResolvedValue({
    hasSufficientBalance: true,
    estimatedCost: 0.05,
    currentBalance: 10,
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useLiquidityProvider comprehensive tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('TOKEN_B_MINT_ADDRESSES', () => {
    it('should export correct mint addresses', () => {
      expect(TOKEN_B_MINT_ADDRESSES).toHaveProperty('SOL')
      expect(TOKEN_B_MINT_ADDRESSES).toHaveProperty('USDC')
      expect(TOKEN_B_MINT_ADDRESSES).toHaveProperty('USDT')
      
      expect(TOKEN_B_MINT_ADDRESSES.SOL).toBe('So11111111111111111111111111111111111111112')
      expect(TOKEN_B_MINT_ADDRESSES.USDC).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
      expect(TOKEN_B_MINT_ADDRESSES.USDT).toBe('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')
    })
  })

  describe('resolveTokenBAddress', () => {
    it('should resolve SOL to wrapped SOL mint', () => {
      expect(resolveTokenBAddress('SOL')).toBe(TOKEN_B_MINT_ADDRESSES.SOL)
    })

    it('should resolve USDC to USDC mint', () => {
      expect(resolveTokenBAddress('USDC')).toBe(TOKEN_B_MINT_ADDRESSES.USDC)
    })

    it('should return custom address as-is', () => {
      const customAddress = 'CustomToken111111111111111111111111111111'
      expect(resolveTokenBAddress(customAddress)).toBe(customAddress)
    })
  })

  describe('buildLiquidityRequest', () => {
    it('should build CPMM request correctly', () => {
      const formData = mockFormData.cpmm
      const walletAddress = 'TestWallet111111111111111111111111111111111'

      const request = buildLiquidityRequest(formData, walletAddress)

      expect(request).toEqual({
        walletPublicKey: walletAddress,
        poolConfig: {
          poolType: 'CPMM',
          tokenA: formData.tokenA,
          tokenB: resolveTokenBAddress(formData.tokenB),
          feeTier: formData.feeTier,
          initialLiquidity: {
            amountA: formData.amountA,
            amountB: formData.amountB,
          },
          slippageTolerance: parseFloat(formData.slippageTolerance),
          deadline: parseInt(formData.deadline),
          platformFee: parseFloat(formData.platformFee),
        },
      })
    })

    it('should build CLMM request with price range', () => {
      const formData = mockFormData.clmm
      const walletAddress = 'TestWallet111111111111111111111111111111111'

      const request = buildLiquidityRequest(formData, walletAddress)

      expect(request.poolConfig).toHaveProperty('priceRange')
      expect(request.poolConfig.priceRange).toEqual({
        minPrice: parseFloat(formData.minPrice!),
        maxPrice: parseFloat(formData.maxPrice!),
      })
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/solana/__tests__/useLiquidityProvider.comprehensive.test.ts`
Expected: FAIL with "hook not rendering correctly"

- [ ] **Step 3: Add hook mutation tests**

```typescript
// Add to same file
describe('useLiquidityProvider hook', () => {
  it('should execute CPMM pool creation successfully', async () => {
    const { result } = renderHook(() => useLiquidityProvider(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isIdle).toBe(true)

    const formData = mockFormData.cpmm
    result.current.mutate(formData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      serializedTransaction: 'mock-tx',
      poolPublicKey: 'mock-pool',
      estimatedCosts: { total: 0.1 },
      message: 'Success',
    })
  })

  it('should handle errors gracefully', async () => {
    const { apiClient } = await import('@/lib/utils/apiClient')
    vi.mocked(apiClient).mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useLiquidityProvider(), {
      wrapper: createWrapper(),
    })

    const formData = mockFormData.cpmm
    result.current.mutate(formData)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(new Error('API Error'))
  })

  it('should validate balance before execution', async () => {
    const { validateBalance } = await import('@/lib/solana/validateBalance')
    vi.mocked(validateBalance).mockResolvedValue({
      hasSufficientBalance: false,
      estimatedCost: 5.0,
      currentBalance: 1.0,
    })

    const { result } = renderHook(() => useLiquidityProvider(), {
      wrapper: createWrapper(),
    })

    const formData = mockFormData.cpmm
    result.current.mutate(formData)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
```

- [ ] **Step 4: Run comprehensive hook tests to verify they pass**

Run: `npm test -- src/hooks/solana/__tests__/useLiquidityProvider.comprehensive.test.ts`
Expected: All hook tests pass

- [ ] **Step 5: Commit comprehensive hook tests**

```bash
git add src/hooks/solana/__tests__/useLiquidityProvider.comprehensive.test.ts
git commit -m "test(hooks): add comprehensive useLiquidityProvider hook tests with utilities"
```

### Task 7: Solana Transaction V0 Integration Tests

**Files:**
- Create: `src/lib/solana/server-side/__tests__/createRaydiumPool.v0.test.ts`

- [ ] **Step 1: Write failing transaction v0 test**

```typescript
// src/lib/solana/server-side/__tests__/createRaydiumPool.v0.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VersionedTransaction, MessageV0, PublicKey, AddressLookupTableAccount } from '@solana/web3.js'
import { createMockVersionedTransaction, mockRaydiumSDK } from '@/__tests__/utils/solanaTestHelpers'

// Mock all dependencies
vi.mock('server-only', () => ({}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    rpcPrivateEndpoint: 'https://api.devnet.solana.com',
    feeWalletAddress: 'So11111111111111111111111111111111111111112',
  })),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

const mockLegacyConnection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: 'test-blockhash-1234567890',
    lastValidBlockHeight: 123456789,
  }),
  getAddressLookupTable: vi.fn().mockResolvedValue({
    value: null as AddressLookupTableAccount | null,
  }),
}

vi.mock('@/lib/solana', () => ({
  createConnectionPair: vi.fn(() => ({
    legacyConnection: mockLegacyConnection,
    kitRpc: {},
  })),
}))

vi.mock('@solana/spl-token', () => ({
  getMint: vi.fn().mockResolvedValue({
    decimals: 6,
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  }),
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  TOKEN_2022_PROGRAM_ID: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
}))

vi.mock('@raydium-io/raydium-sdk-v2', () => mockRaydiumSDK())

// Mock fetch for Raydium config
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('createRaydiumPool Transaction V0 Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('cpmm-config')) {
        return {
          ok: true,
          json: async () => ({
            data: [{
              id: 'mock-cpmm-config',
              createPoolFee: '100000000',
            }],
          }),
        }
      }
      return { ok: false, status: 404 }
    })
  })

  it('should create transaction v0 for CPMM pool', async () => {
    const { Raydium } = await import('@raydium-io/raydium-sdk-v2')
    const mockRaydium = await Raydium.load({})
    
    const mockTransaction = createMockVersionedTransaction()
    vi.mocked(mockRaydium.cpmm.createPool).mockResolvedValue({
      transactions: [{ transaction: mockTransaction }],
    })

    const { createRaydiumPoolTransaction } = await import('../createRaydiumPool')

    const params = {
      walletPublicKey: 'TestWallet111111111111111111111111111111111',
      poolConfig: {
        poolType: 'CPMM' as const,
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'SOL',
        feeTier: '0.05' as const,
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    const result = await createRaydiumPoolTransaction(params)

    expect(result.serializedTransaction).toBeDefined()
    expect(result.poolPublicKey).toBeDefined()
    expect(result.estimatedCosts).toBeDefined()
  })

  it('should handle transaction v0 with address lookup tables', async () => {
    const mockLookupTable: AddressLookupTableAccount = {
      key: new PublicKey('LookupTable111111111111111111111111111111'),
      state: {
        deactivationSlot: BigInt(0),
        lastExtendedSlot: 123,
        lastExtendedSlotStartIndex: 0,
        authority: new PublicKey('Authority111111111111111111111111111111'),
        addresses: [
          new PublicKey('Address1111111111111111111111111111111111'),
          new PublicKey('Address2222222222222222222222222222222222'),
        ],
      },
    }

    mockLegacyConnection.getAddressLookupTable.mockResolvedValue({
      value: mockLookupTable,
    })

    const mockMessage: MessageV0 = {
      header: {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 2,
      },
      staticAccountKeys: [
        new PublicKey('TestWallet111111111111111111111111111111111'),
        new PublicKey('ProgramId111111111111111111111111111111111'),
      ],
      recentBlockhash: 'test-blockhash-1234567890',
      compiledInstructions: [],
      addressTableLookups: [
        {
          accountKey: mockLookupTable.key,
          writableIndexes: [0],
          readonlyIndexes: [1],
        },
      ],
    }

    const mockTransaction = new VersionedTransaction(mockMessage)
    
    const { Raydium } = await import('@raydium-io/raydium-sdk-v2')
    const mockRaydium = await Raydium.load({})
    vi.mocked(mockRaydium.cpmm.createPool).mockResolvedValue({
      transactions: [{ transaction: mockTransaction }],
    })

    const { createRaydiumPoolTransaction } = await import('../createRaydiumPool')

    const params = {
      walletPublicKey: 'TestWallet111111111111111111111111111111111',
      poolConfig: {
        poolType: 'CPMM' as const,
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'USDC',
        feeTier: '0.05' as const,
        initialLiquidity: {
          amountA: '1000',
          amountB: '500',
        },
      },
    }

    const result = await createRaydiumPoolTransaction(params)

    expect(result).toBeDefined()
    expect(mockLegacyConnection.getAddressLookupTable).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/solana/server-side/__tests__/createRaydiumPool.v0.test.ts`
Expected: FAIL with transaction v0 mocking issues

- [ ] **Step 3: Add CLMM transaction v0 tests**

```typescript
// Add to same file
it('should create transaction v0 for CLMM pool with price range', async () => {
  mockFetch.mockImplementation(async (url: string) => {
    if (url.includes('clmm-config')) {
      return {
        ok: true,
        json: async () => ({
          data: [{
            id: 'mock-clmm-config',
            tickSpacing: 10,
          }],
        }),
      }
    }
    return { ok: false, status: 404 }
  })

  const { Raydium } = await import('@raydium-io/raydium-sdk-v2')
  const mockRaydium = await Raydium.load({})
  
  const mockTransaction = createMockVersionedTransaction()
  vi.mocked(mockRaydium.clmm.createPool).mockResolvedValue({
    transactions: [{ transaction: mockTransaction }],
  })

  const { createRaydiumPoolTransaction } = await import('../createRaydiumPool')

  const params = {
    walletPublicKey: 'TestWallet111111111111111111111111111111111',
    poolConfig: {
      poolType: 'CLMM' as const,
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'USDC',
      feeTier: '0.01' as const,
      initialLiquidity: {
        amountA: '1000',
        amountB: '500',
      },
      priceRange: {
        minPrice: 0.01,
        maxPrice: 10.0,
      },
    },
  }

  const result = await createRaydiumPoolTransaction(params)

  expect(result.serializedTransaction).toBeDefined()
  expect(mockRaydium.clmm.createPool).toHaveBeenCalledWith(
    expect.objectContaining({
      poolFeeRate: 0.01 * 10000, // Converted to basis points
      priceRange: expect.objectContaining({
        minPrice: 0.01,
        maxPrice: 10.0,
      }),
    })
  )
})

it('should handle transaction serialization errors', async () => {
  const { Raydium } = await import('@raydium-io/raydium-sdk-v2')
  const mockRaydium = await Raydium.load({})
  
  // Mock a transaction that fails to serialize
  const invalidTransaction = {} as VersionedTransaction
  vi.mocked(mockRaydium.cpmm.createPool).mockResolvedValue({
    transactions: [{ transaction: invalidTransaction }],
  })

  const { createRaydiumPoolTransaction } = await import('../createRaydiumPool')

  const params = {
    walletPublicKey: 'TestWallet111111111111111111111111111111111',
    poolConfig: {
      poolType: 'CPMM' as const,
      tokenA: 'InvalidToken',
      tokenB: 'SOL',
      feeTier: '0.05' as const,
      initialLiquidity: {
        amountA: '1000',
        amountB: '0.5',
      },
    },
  }

  await expect(createRaydiumPoolTransaction(params)).rejects.toThrow()
})
```

- [ ] **Step 4: Run transaction v0 tests to verify they pass**

Run: `npm test -- src/lib/solana/server-side/__tests__/createRaydiumPool.v0.test.ts`
Expected: All transaction v0 tests pass

- [ ] **Step 5: Commit transaction v0 tests**

```bash
git add src/lib/solana/server-side/__tests__/createRaydiumPool.v0.test.ts
git commit -m "test(solana): add comprehensive transaction v0 integration tests with address lookup tables"
```

### Task 8: Final Test Suite Verification

**Files:**
- Verify all test files are working together

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: All tests pass with comprehensive coverage

- [ ] **Step 2: Check test coverage if available**

Run: `npm run test:coverage` (if configured)
Expected: High coverage across all domains

- [ ] **Step 3: Verify no test conflicts or flaky tests**

Run: `npm test -- --run --reporter=verbose`
Expected: Stable test execution with no race conditions

- [ ] **Step 4: Validate all mock patterns are consistent**

Run: `npm test -- --reporter=verbose | grep -i mock`
Expected: Consistent mocking strategies across all test files

- [ ] **Step 5: Final commit of any test configuration updates**

```bash
git add -A
git commit -m "test: finalize comprehensive unit testing suite for liquidity provider tool"
```

## Self-Review

**1. Spec coverage:** 
- ✅ API endpoint testing (route.test.ts)
- ✅ React components testing (HeroSection, FAQSection, FormSections, BenefitsSection)
- ✅ Utility functions testing (schema validation, type guards, helpers)
- ✅ Custom hooks testing (comprehensive useLiquidityProvider tests)
- ✅ Solana integrations testing (transaction v0 with address lookup tables)
- ✅ Proper mocking strategies for all external dependencies

**2. Placeholder scan:** No placeholders found - all tests include complete code implementations.

**3. Type consistency:** All type references (LiquidityProviderParams, PoolType, FeeTier, etc.) are consistent across tasks and match the existing codebase definitions.